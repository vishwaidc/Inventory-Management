const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// POST /api/service — log new service (admin/mechanic only), always starts as pending_review
router.post('/', authorizeRole(['admin', 'mechanic']), async (req, res) => {
    const { equipment_id, service_type, issue_reported, work_done, parts_replaced, parts_used, status, next_service_due, before_image_url, after_image_url } = req.body;
    const technician_id = req.user.id;

    if (!equipment_id) return res.status(400).json({ error: 'equipment_id is required' });

    try {
        const { data: equip, error: equipErr } = await supabase
            .from('equipment').select('id').eq('id', equipment_id).single();
        if (equipErr || !equip) return res.status(400).json({ error: 'Equipment not found' });

        const service_date = new Date().toISOString().split('T')[0];
        const due = next_service_due || (() => {
            const d = new Date(); d.setMonth(d.getMonth() + 6);
            return d.toISOString().split('T')[0];
        })();

        // Hardware Auto-Deduction execution
        if (parts_used && Array.isArray(parts_used)) {
            for (const item of parts_used) {
                if (!item.part_id) continue;
                const { data: partInfo, error: pErr } = await supabase
                    .from('parts_inventory')
                    .select('quantity')
                    .eq('id', item.part_id)
                    .single();
                
                if (partInfo && !pErr) {
                    const newQty = partInfo.quantity - (item.quantity || 1);
                    await supabase.from('parts_inventory').update({ quantity: newQty < 0 ? 0 : newQty }).eq('id', item.part_id);
                }
            }
        }

        const { data, error } = await supabase
            .from('service_history')
            .insert([{
                equipment_id, technician_id, service_date,
                service_type: service_type || 'General Service',
                issue_reported, work_done, parts_replaced,
                next_service_due: due,
                status: status || 'completed',
                before_image_url: before_image_url || null,
                after_image_url: after_image_url || null,
                approval_status: 'pending_review',
            }])
            .select('*, technician:users!technician_id(name, email)')
            .single();

        if (error) throw error;
        await supabase.from('equipment').update({ last_service_date: service_date }).eq('id', equipment_id);
        res.status(201).json(data);
    } catch (error) {
        console.error('Service log error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/service/pending — admin only: all pending_review logs with full details
router.get('/pending', authorizeRole(['admin']), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('service_history')
            .select(`
                *,
                technician:users!technician_id(name, email),
                equipment:equipment!equipment_id(equipment_name, brand, model_number, serial_number, department, location)
            `)
            .eq('approval_status', 'pending_review')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/service/:id/approve — admin only
router.patch('/:id/approve', authorizeRole(['admin']), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('service_history')
            .update({ approval_status: 'approved', admin_note: null })
            .eq('id', req.params.id)
            .select('*').single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/service/:id/reject — admin only
router.patch('/:id/reject', authorizeRole(['admin']), async (req, res) => {
    const { admin_note } = req.body;
    try {
        const { data, error } = await supabase
            .from('service_history')
            .update({ approval_status: 'rejected', admin_note: admin_note || 'Rejected by admin' })
            .eq('id', req.params.id)
            .select('*').single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/service/:equipmentId — get approved + pending_review logs for a device
router.get('/:equipmentId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('service_history')
            .select('*, technician:users!technician_id(name, email)')
            .eq('equipment_id', req.params.equipmentId)
            .in('approval_status', ['approved', 'pending_review'])
            .order('service_date', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/service/:id — update service record (admin/mechanic only)
router.put('/:id', authorizeRole(['admin', 'mechanic']), async (req, res) => {
    const { service_type, issue_reported, work_done, parts_replaced, status, next_service_due } = req.body;
    try {
        const { data, error } = await supabase
            .from('service_history')
            .update({ service_type, issue_reported, work_done, parts_replaced, status, next_service_due })
            .eq('id', req.params.id)
            .select('*, technician:users!technician_id(name, email)').single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
