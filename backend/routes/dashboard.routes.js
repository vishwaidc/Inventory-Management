const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth.middleware');

// All dashboard routes require login
router.use(authenticateToken);

// GET /api/dashboard/stats
// Mechanic → full analytics (equipment count, due, overdue, recent logs)
// Customer → basic view (equipment count only)
router.get('/stats', async (req, res) => {
    const role = req.user?.role;
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Total equipment count (all authenticated users)
        const { count: totalEquipment, error: err1 } = await supabase
            .from('equipment')
            .select('*', { count: 'exact', head: true });

        if (err1) throw err1;

        // Customers get a simplified response
        if (role === 'customer') {
            return res.json({
                stats: {
                    totalEquipment: totalEquipment || 0,
                    dueForService: null,
                    overdueMaintenance: null
                },
                recentLogs: [],
                role: 'customer'
            });
        }

        // Mechanic: full stats
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        const nextMonthStr = nextMonth.toISOString().split('T')[0];

        const { count: dueForService, error: err2 } = await supabase
            .from('service_history')
            .select('*', { count: 'exact', head: true })
            .gte('next_service_due', today)
            .lte('next_service_due', nextMonthStr)
            .eq('status', 'completed');

        if (err2) throw err2;

        const { count: overdueMaintenance, error: err3 } = await supabase
            .from('service_history')
            .select('*', { count: 'exact', head: true })
            .lt('next_service_due', today)
            .eq('status', 'completed');

        if (err3) throw err3;

        const { data: recentLogs, error: err4 } = await supabase
            .from('service_history')
            .select(`
                id,
                service_date,
                service_type,
                status,
                equipment:equipment_id(equipment_name, department),
                technician:technician_id(name)
            `)
            .order('service_date', { ascending: false })
            .limit(5);

        if (err4) throw err4;

        // --- NEW: Chart Telemetry Aggregation ---
        const { data: allEquipment } = await supabase.from('equipment').select('department');
        const { data: allServices } = await supabase.from('service_history').select('service_type');

        const deptCount = {};
        if (allEquipment) {
            allEquipment.forEach(item => {
                const dept = item.department || 'Unassigned';
                deptCount[dept] = (deptCount[dept] || 0) + 1;
            });
        }
        
        const serviceCount = {};
        if (allServices) {
            allServices.forEach(item => {
                const type = item.service_type || 'General Service';
                serviceCount[type] = (serviceCount[type] || 0) + 1;
            });
        }

        const departmentDistribution = Object.keys(deptCount).map(key => ({ name: key, value: deptCount[key] }));
        const serviceTypeDistribution = Object.keys(serviceCount).map(key => ({ name: key, value: serviceCount[key] }));

        res.json({
            stats: {
                totalEquipment: totalEquipment || 0,
                dueForService: dueForService || 0,
                overdueMaintenance: overdueMaintenance || 0
            },
            recentLogs: recentLogs || [],
            charts: {
                departmentDistribution,
                serviceTypeDistribution
            },
            role: 'mechanic'
        });

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

module.exports = router;
