const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/public/equipment/:id
// No auth required — returns device info + approved service history for QR scan public view
router.get('/equipment/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('equipment')
            .select(`
                id, equipment_name, brand, model_number, serial_number,
                department, location, purchase_date, warranty_expiry, last_service_date,
                service_history(
                    id, service_date, service_type, work_done,
                    parts_replaced, status, next_service_due,
                    approval_status,
                    technician:users!technician_id(name)
                )
            `)
            .eq('id', req.params.id)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Device not found' });

        // Only return approved service history entries
        const filtered = {
            ...data,
            service_history: (data.service_history || [])
                .filter(s => s.approval_status === 'approved')
                .sort((a, b) => new Date(b.service_date) - new Date(a.service_date))
        };

        res.json(filtered);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
