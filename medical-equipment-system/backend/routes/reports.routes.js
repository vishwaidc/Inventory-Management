const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Anthropic = require('@anthropic-ai/sdk');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth.middleware');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Helper: draw a filled rounded rectangle (used for info boxes)
function drawBox(doc, x, y, w, h, fillColor) {
    doc.save()
        .fillColor(fillColor)
        .roundedRect(x, y, w, h, 6)
        .fill()
        .restore();
}

// Helper: safe string fallback
const safe = (v) => (v && String(v).trim()) ? String(v).trim() : '—';

// Helper: format date nicely
function fmtDate(d) {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return String(d);
    }
}

// GET /api/reports/service/:serviceId
router.get('/service/:serviceId', authenticateToken, async (req, res) => {
    const { serviceId } = req.params;

    try {
        // 1. Fetch service record
        const { data: service, error: sErr } = await supabase
            .from('service_history')
            .select('*')
            .eq('id', serviceId)
            .single();

        if (sErr || !service) {
            return res.status(404).json({ error: 'Service record not found' });
        }

        // 2. Fetch equipment details
        const { data: equipment, error: eErr } = await supabase
            .from('equipment')
            .select('*')
            .eq('id', service.equipment_id)
            .single();

        if (eErr || !equipment) {
            return res.status(404).json({ error: 'Equipment not found' });
        }

        // 3. Fetch technician name
        let technicianName = 'N/A';
        if (service.technician_id) {
            const { data: tech } = await supabase
                .from('users')
                .select('name')
                .eq('id', service.technician_id)
                .single();
            if (tech) technicianName = tech.name;
        }

        // 4. Fetch customer name
        let customerName = 'N/A';
        if (equipment.customer_id) {
            const { data: cust } = await supabase
                .from('users')
                .select('name')
                .eq('id', equipment.customer_id)
                .single();
            if (cust) customerName = cust.name;
        }

        // 5. Generate AI summary via Claude (with fallback if API key not configured)
        let aiSummary = '';
        const hasApiKey = process.env.ANTHROPIC_API_KEY &&
            process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here' &&
            process.env.ANTHROPIC_API_KEY.startsWith('sk-');

        if (hasApiKey) {
            try {
                const prompt = `You are a professional technical report writer for an equipment service company.

Generate a formal service report summary based on the following data:

Equipment: ${safe(equipment.equipment_name)} (${safe(equipment.brand)} ${safe(equipment.model_number)})
Serial Number: ${safe(equipment.serial_number)}
Location: ${safe(equipment.location)} — ${safe(equipment.department)}
Customer: ${customerName}

Service Details:
- Service Type: ${safe(service.service_type)}
- Issue Reported: ${safe(service.issue_reported)}
- Work Performed: ${safe(service.work_done)}
- Parts Replaced: ${safe(service.parts_replaced)}
- Service Status: ${safe(service.status)}
- Technician: ${technicianName}
- Service Date: ${fmtDate(service.service_date || service.created_at)}
- Next Service Due: ${fmtDate(service.next_service_due)}

Write a professional 3-paragraph summary suitable for a customer-facing service report:
Paragraph 1: Describe the issue that was reported and initial findings
Paragraph 2: Describe the work performed and how the issue was resolved
Paragraph 3: Provide recommendations and next service guidance

Keep it professional, clear, and customer-friendly. Do not use bullet points — write in clean paragraph form.`;

                const aiMessage = await anthropic.messages.create({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: prompt }],
                });
                aiSummary = aiMessage.content[0]?.text || '';
            } catch (aiErr) {
                console.warn('AI summary failed, using fallback:', aiErr.message);
            }
        }

        // Fallback: build structured summary from service data
        if (!aiSummary) {
            const issue = safe(service.issue_reported);
            const work = safe(service.work_done);
            const parts = safe(service.parts_replaced);
            const nextDue = fmtDate(service.next_service_due);

            aiSummary = `A service visit was conducted on ${fmtDate(service.service_date || service.created_at)} for the ${safe(equipment.equipment_name)} located in ${safe(equipment.department)}, ${safe(equipment.location)}. The issue reported was: ${issue}. The equipment was assessed by technician ${technicianName} and the necessary diagnostic steps were carried out.\n\n` +
                `The following work was performed during this service visit: ${work}. ${parts !== '—' ? `Parts replaced during this service include: ${parts}.` : 'No parts were replaced during this visit.'} The service was completed with a status of "${safe(service.status)}".\n\n` +
                `It is recommended that routine maintenance checks continue as scheduled. ${nextDue !== '—' ? `The next scheduled service for this equipment is due on ${nextDue}.` : 'Please contact the service team to schedule the next maintenance session.'} For any concerns or follow-up requirements, please reach out to the maintenance team promptly.`;
        }

        // 6. Build PDF
        const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });

        // Set response headers BEFORE piping
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="service-report-${serviceId}.pdf"`);
        doc.pipe(res);

        const pageW = doc.page.width; // 595
        const contentW = pageW - 100; // margins 50 each side
        const generatedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        // ── SECTION 1: Header ────────────────────────────────────────────────
        doc.font('Helvetica-Bold').fontSize(20).fillColor('#1a1a2e')
            .text('Equipment Service Management', 50, 50, { align: 'center', width: contentW });

        doc.font('Helvetica').fontSize(14).fillColor('#6b7280')
            .text('Service Report', 50, 78, { align: 'center', width: contentW });

        doc.moveTo(50, 102).lineTo(pageW - 50, 102).strokeColor('#e5e7eb').lineWidth(1).stroke();

        doc.font('Helvetica').fontSize(9).fillColor('#9ca3af')
            .text(`Generated: ${generatedDate}`, 50, 110, { align: 'right', width: contentW });

        // ── SECTION 2: Equipment Info Box ────────────────────────────────────
        const eqBoxY = 132;
        const eqBoxH = 110;
        drawBox(doc, 50, eqBoxY, contentW, eqBoxH, '#f9fafb');

        doc.font('Helvetica-Bold').fontSize(11).fillColor('#1f2937')
            .text('Equipment Information', 62, eqBoxY + 10);

        const colW = contentW / 2 - 10;
        const leftX = 62;
        const rightX = 50 + contentW / 2 + 10;

        const leftEqFields = [
            ['Equipment Name', safe(equipment.equipment_name)],
            ['Brand', safe(equipment.brand)],
            ['Model Number', safe(equipment.model_number)],
            ['Serial No.', safe(equipment.serial_number)],
        ];

        const rightEqFields = [
            ['Customer', customerName],
            ['Department', safe(equipment.department)],
            ['Location', safe(equipment.location)],
            ['Warranty Expiry', fmtDate(equipment.warranty_expiry)],
        ];

        let fieldY = eqBoxY + 28;
        leftEqFields.forEach(([label, value]) => {
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#6b7280').text(label, leftX, fieldY, { width: colW });
            doc.font('Helvetica').fontSize(9).fillColor('#111827').text(value, leftX, fieldY + 10, { width: colW });
            fieldY += 22;
        });

        fieldY = eqBoxY + 28;
        rightEqFields.forEach(([label, value]) => {
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#6b7280').text(label, rightX, fieldY, { width: colW });
            doc.font('Helvetica').fontSize(9).fillColor('#111827').text(value, rightX, fieldY + 10, { width: colW });
            fieldY += 22;
        });

        // ── SECTION 3: Service Details Box ───────────────────────────────────
        const svBoxY = eqBoxY + eqBoxH + 14;
        const svBoxH = 90;
        drawBox(doc, 50, svBoxY, contentW, svBoxH, '#f0fdf4');

        doc.font('Helvetica-Bold').fontSize(11).fillColor('#1f2937')
            .text('Service Details', 62, svBoxY + 10);

        const statusColors = {
            completed: '#059669',
            'in-progress': '#2563eb',
            pending: '#f59e0b',
        };
        const statusColor = statusColors[service.status] || '#6b7280';

        const leftSvFields = [
            ['Service Type', safe(service.service_type)],
            ['Technician', technicianName],
        ];
        const rightSvFields = [
            ['Service Date', fmtDate(service.service_date || service.created_at)],
            ['Next Service Due', fmtDate(service.next_service_due)],
        ];

        let svFieldY = svBoxY + 28;
        leftSvFields.forEach(([label, value]) => {
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#6b7280').text(label, leftX, svFieldY, { width: colW });
            doc.font('Helvetica').fontSize(9).fillColor('#111827').text(value, leftX, svFieldY + 10, { width: colW });
            svFieldY += 22;
        });

        // Status with colored dot
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#6b7280').text('Status', leftX, svBoxY + 28 + 44, { width: colW });
        doc.circle(leftX + 4, svBoxY + 28 + 44 + 14, 4).fillColor(statusColor).fill();
        doc.font('Helvetica').fontSize(9).fillColor(statusColor)
            .text(safe(service.status), leftX + 12, svBoxY + 28 + 44 + 8, { width: colW });

        svFieldY = svBoxY + 28;
        rightSvFields.forEach(([label, value]) => {
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#6b7280').text(label, rightX, svFieldY, { width: colW });
            doc.font('Helvetica').fontSize(9).fillColor('#111827').text(value, rightX, svFieldY + 10, { width: colW });
            svFieldY += 22;
        });

        // ── SECTION 4: AI-Generated Summary ──────────────────────────────────
        const sumY = svBoxY + svBoxH + 18;

        doc.font('Helvetica-Bold').fontSize(14).fillColor('#1f2937')
            .text('Service Summary', 50, sumY);

        doc.moveTo(50, sumY + 20).lineTo(pageW - 50, sumY + 20).strokeColor('#e5e7eb').lineWidth(1).stroke();

        // Split AI summary into paragraphs and render each
        const paragraphs = aiSummary.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
        let paraY = sumY + 30;

        paragraphs.forEach((para) => {
            doc.font('Helvetica').fontSize(11).fillColor('#374151')
                .text(para, 50, paraY, {
                    width: contentW,
                    align: 'justify',
                    lineGap: 4,
                });
            paraY = doc.y + 12;
        });

        // ── SECTION 5: Footer ────────────────────────────────────────────────
        const footerY = doc.page.height - 70;
        doc.moveTo(50, footerY).lineTo(pageW - 50, footerY).strokeColor('#e5e7eb').lineWidth(1).stroke();

        doc.font('Helvetica').fontSize(8).fillColor('#9ca3af')
            .text(
                'This report was automatically generated by the Equipment Service Management System',
                50, footerY + 10,
                { align: 'center', width: contentW }
            );

        doc.font('Helvetica').fontSize(8).fillColor('#9ca3af')
            .text(`Page 1 of 1`, 50, footerY + 24, { align: 'center', width: contentW });

        doc.end();

    } catch (error) {
        console.error('Report Generation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate service report', details: error.message });
        }
    }
});

module.exports = router;
