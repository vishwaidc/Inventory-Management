const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// GET /api/parts — see all parts
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('parts_inventory')
            .select('*')
            .order('part_name');
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/parts — add new part layout
router.post('/', authorizeRole(['admin', 'mechanic']), async (req, res) => {
    const { part_name, part_number, quantity, threshold } = req.body;
    
    if (!part_name) return res.status(400).json({ error: 'Part name is required' });

    try {
        const { data, error } = await supabase
            .from('parts_inventory')
            .insert([{ part_name, part_number, quantity: quantity || 0, threshold: threshold || 5 }])
            .select()
            .single();
            
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Part configuration/number already exists' });
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/parts/:id — update stock
router.put('/:id', authorizeRole(['admin', 'mechanic']), async (req, res) => {
    const { part_name, part_number, quantity, threshold } = req.body;
    try {
        const { data, error } = await supabase
            .from('parts_inventory')
            .update({ part_name, part_number, quantity, threshold })
            .eq('id', req.params.id)
            .select()
            .single();
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/parts/:id — remove entity completely
router.delete('/:id', authorizeRole(['admin', 'mechanic']), async (req, res) => {
    try {
        const { error } = await supabase.from('parts_inventory').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Part successfully destroyed from inventory' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
