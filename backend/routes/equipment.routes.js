const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');
const crypto = require('crypto');
const QRCode = require('qrcode');
const bcrypt = require('bcrypt');

router.use(authenticateToken);

// GET /api/equipment — mechanic sees all, customer sees only their own
router.get('/', async (req, res) => {
    try {
        let query = supabase
            .from('equipment')
            .select('*, customer:customer_id(name, email), service_history(id, service_date, status)')
            .order('created_at', { ascending: false });

        // Customer: only their devices
        if (req.user.role === 'customer') {
            query = query.eq('customer_id', req.user.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/equipment/:id — get single device with full service history
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('equipment')
            .select(`
                *,
                customer:customer_id(id, name, email),
                service_history(
                    id, service_date, service_type, issue_reported,
                    work_done, parts_replaced, status, next_service_due, created_at,
                    before_image_url, after_image_url,
                    approval_status, admin_note,
                    technician:technician_id(name, email)
                )
            `)
            .eq('id', req.params.id)
            .single();


        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Equipment not found' });

        // Customer can only view their own device
        if (req.user.role === 'customer' && data.customer_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/equipment — add new device (mechanic only)
// Also creates a customer account (if email doesn't exist) with default password
router.post('/', authorizeRole(['mechanic']), async (req, res) => {
    const {
        equipment_name, brand, model_number, serial_number,
        purchase_date, warranty_expiry, department, location,
        last_service_date, customer_email, customer_name
    } = req.body;

    if (!equipment_name) return res.status(400).json({ error: 'Equipment name is required' });
    if (!customer_email) return res.status(400).json({ error: 'Customer email is required' });

    try {
        // Find or create customer account with default password
        let customerId = null;
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', customer_email)
            .single();

        if (existingUser) {
            customerId = existingUser.id;
        } else {
            // Auto-create customer with default password
            const defaultPassword = 'password123';
            const passwordHash = await bcrypt.hash(defaultPassword, 10);
            const { data: newUser, error: userError } = await supabase
                .from('users')
                .insert([{
                    name: customer_name || customer_email.split('@')[0],
                    email: customer_email,
                    password_hash: passwordHash,
                    role: 'customer'
                }])
                .select('id')
                .single();

            if (userError) throw userError;
            customerId = newUser.id;
        }

        // Generate UUID and build equipment page URL for QR
        const equipmentId = crypto.randomUUID();
        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
        const equipmentPageUrl = `${FRONTEND_URL}/equipment/${equipmentId}`;

        const { data, error } = await supabase
            .from('equipment')
            .insert([{
                id: equipmentId,
                equipment_name,
                brand,
                model_number,
                serial_number,
                purchase_date: purchase_date || null,
                warranty_expiry: warranty_expiry || null,
                department,
                location,
                last_service_date: last_service_date || null,
                customer_id: customerId,
                qr_code_value: equipmentPageUrl  // short URL stored in DB
            }])
            .select(`*, customer:customer_id(name, email)`)
            .single();

        if (error) throw error;

        // Generate QR image AFTER insert — returned in API response, not stored in DB
        const qrCodeDataUrl = await QRCode.toDataURL(equipmentPageUrl, { width: 300, margin: 2 });

        res.status(201).json({
            ...data,
            qr_code_image: qrCodeDataUrl,   // base64 image for immediate display
            customer_created: !existingUser,
            customer_default_password: !existingUser ? 'password123' : undefined
        });
    } catch (error) {
        console.error('Add Equipment Error:', error);
        if (error.code === '23505') return res.status(409).json({ error: 'Serial number already exists' });
        res.status(500).json({ error: error.message });
    }
});


// PUT /api/equipment/:id — update device details (mechanic only)
router.put('/:id', authorizeRole(['mechanic']), async (req, res) => {
    const {
        equipment_name, brand, model_number, serial_number,
        purchase_date, warranty_expiry, department, location, last_service_date
    } = req.body;

    try {
        const { data, error } = await supabase
            .from('equipment')
            .update({
                equipment_name, brand, model_number, serial_number,
                purchase_date: purchase_date || null,
                warranty_expiry: warranty_expiry || null,
                department, location,
                last_service_date: last_service_date || null
            })
            .eq('id', req.params.id)
            .select('*, customer:customer_id(name, email)')
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/equipment/:id — mechanic only
router.delete('/:id', authorizeRole(['mechanic']), async (req, res) => {
    try {
        const { error } = await supabase.from('equipment').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Equipment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
