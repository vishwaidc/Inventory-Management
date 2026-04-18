import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://inventory-management-xbb6.onrender.com/api' : 'http://localhost:5000/api');

const Dashboard = () => {
    const { user, token, isMechanic, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        axios.get(`${API}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => setStats(r.data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, [token, navigate]);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const renderCharts = () => {
        if (!stats?.charts) return null;
        if (stats.charts.departmentDistribution.length === 0 && stats.charts.serviceTypeDistribution.length === 0) return null;
        
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div className="card" style={{ padding: '16px' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', textAlign: 'center' }}>Equipment per Dept</h3>
                    <div style={{ width: '100%', height: 180 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={stats.charts.departmentDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                                    {stats.charts.departmentDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip wrapperStyle={{fontSize: "12px", zIndex: 100}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="card" style={{ padding: '16px' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', textAlign: 'center' }}>Service Activity</h3>
                    <div style={{ width: '100%', height: 180 }}>
                        <ResponsiveContainer>
                            <BarChart data={stats.charts.serviceTypeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{fontSize: 9}} angle={-15} textAnchor="end" height={40} />
                                <Tooltip wrapperStyle={{fontSize: "12px", zIndex: 100}} cursor={{fill: 'transparent'}} />
                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="state-center"><div className="state-icon">⏳</div><p>Loading Dashboard...</p></div>;

    // ─── MECHANIC ─────────────────────────────────────────────
    if (isMechanic) {
        return (
            <div className="page">
                <div className="banner banner-mechanic">
                    <div className="banner-icon">🔧</div>
                    <div>
                        <h2 style={{ margin: '0 0 4px', fontSize: '1.15rem' }}>Welcome, {user?.name || 'Mechanic'}!</h2>
                        <p style={{ margin: 0, opacity: 0.85, fontSize: '0.82rem' }}>Mechanic Dashboard</p>
                    </div>
                </div>

                {/* Quick actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <button className="card" style={{ cursor: 'pointer', textAlign: 'center', border: 'none', background: 'white' }}
                        onClick={() => navigate('/scan')}>
                        <div style={{ fontSize: '2rem', marginBottom: '6px' }}>📷</div>
                        <p style={{ fontWeight: '700', margin: '0 0 2px', fontSize: '0.9rem' }}>Scan QR</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>Scan equipment QR code</p>
                    </button>
                    <button className="card" style={{ cursor: 'pointer', textAlign: 'center', border: 'none', background: 'white' }}
                        onClick={() => navigate('/devices')}>
                        <div style={{ fontSize: '2rem', marginBottom: '6px' }}>📋</div>
                        <p style={{ fontWeight: '700', margin: '0 0 2px', fontSize: '0.9rem' }}>All Devices</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>View & manage</p>
                    </button>
                </div>

                {/* Stats */}
                <div className="stat-grid">
                    <div className="stat-card">
                        <div className="stat-icon">⚙️</div>
                        <div className="stat-num">{stats?.stats?.totalEquipment ?? '—'}</div>
                        <div className="stat-label">Total Equipment</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🕐</div>
                        <div className="stat-num" style={{ color: 'var(--warning)' }}>{stats?.stats?.dueForService ?? '—'}</div>
                        <div className="stat-label">Due (30 Days)</div>
                    </div>
                </div>

                {/* Overdue */}
                {stats?.stats?.overdueMaintenance > 0 && (
                    <div className="card" style={{ borderLeft: '4px solid var(--danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                            <div>
                                <p style={{ fontWeight: '700', margin: '0 0 2px', fontSize: '0.9rem' }}>Overdue Maintenance</p>
                                <p style={{ color: 'var(--text-muted)', font: '0.78rem', margin: 0 }}>Requires immediate attention</p>
                            </div>
                        </div>
                        <span style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--danger)' }}>{stats?.stats?.overdueMaintenance}</span>
                    </div>
                )}

                {/* Charts Telemetry */}
                {renderCharts()}

                {/* Recent service logs */}
                {stats?.recentLogs?.length > 0 && (
                    <div className="card">
                        <div className="card-header">
                            <h3 style={{ fontSize: '0.9rem' }}>🕐 Recent Service Logs</h3>
                            <button className="btn btn-outline btn-sm" onClick={() => navigate('/devices')}>View All</button>
                        </div>
                        {stats.recentLogs.map((log, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < stats.recentLogs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <div>
                                    <p style={{ fontWeight: '600', margin: '0 0 3px', fontSize: '0.87rem' }}>{log.equipment?.equipment_name || 'Unknown'}</p>
                                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.75rem' }}>{log.service_date} · {log.technician?.name || 'Mechanic'}</p>
                                </div>
                                <span className={`badge ${log.status === 'completed' ? 'badge-completed' : 'badge-pending'}`}>{log.status}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div style={{ height: '16px' }} />
            </div>
        );
    }

    // ─── ADMIN ────────────────────────────────────────────────
    if (isAdmin) {
        return (
            <div className="page">
                <div className="banner" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', marginBottom: '16px', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '2rem' }}>🛡️</div>
                    <div>
                        <h2 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: '#fff' }}>Welcome, {user?.name || 'Admin'}!</h2>
                        <p style={{ margin: 0, opacity: 0.85, fontSize: '0.82rem', color: '#e0e7ff' }}>Admin Dashboard</p>
                    </div>
                </div>

                {/* Quick actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <button className="card" style={{ cursor: 'pointer', textAlign: 'center', border: 'none', background: 'white' }}
                        onClick={() => navigate('/admin/review')}>
                        <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🛡️</div>
                        <p style={{ fontWeight: '700', margin: '0 0 2px', fontSize: '0.9rem' }}>Review Logs</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>Approve / Reject</p>
                    </button>
                    <button className="card" style={{ cursor: 'pointer', textAlign: 'center', border: 'none', background: 'white' }}
                        onClick={() => navigate('/add-device')}>
                        <div style={{ fontSize: '2rem', marginBottom: '6px' }}>➕</div>
                        <p style={{ fontWeight: '700', margin: '0 0 2px', fontSize: '0.9rem' }}>Add Device</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>Register equipment</p>
                    </button>
                </div>

                {/* Stats */}
                <div className="stat-grid">
                    <div className="stat-card">
                        <div className="stat-icon">⚙️</div>
                        <div className="stat-num">{stats?.stats?.totalEquipment ?? '—'}</div>
                        <div className="stat-label">Total Equipment</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🕐</div>
                        <div className="stat-num" style={{ color: 'var(--warning)' }}>{stats?.stats?.dueForService ?? '—'}</div>
                        <div className="stat-label">Due (30 Days)</div>
                    </div>
                </div>

                {stats?.stats?.overdueMaintenance > 0 && (
                    <div className="card" style={{ borderLeft: '4px solid var(--danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                            <div>
                                <p style={{ fontWeight: '700', margin: '0 0 2px', fontSize: '0.9rem' }}>Overdue Maintenance</p>
                                <p style={{ color: 'var(--text-muted)', font: '0.78rem', margin: 0 }}>Requires immediate attention</p>
                            </div>
                        </div>
                        <span style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--danger)' }}>{stats?.stats?.overdueMaintenance}</span>
                    </div>
                )}

                {/* Charts Telemetry */}
                {renderCharts()}

                <button className="btn btn-primary btn-full" onClick={() => navigate('/devices')} style={{ marginTop: '4px' }}>
                    📋 View All Devices →
                </button>
                <div style={{ height: '16px' }} />
            </div>
        );
    }

    // ─── CUSTOMER (fallback) ──────────────────────────────────
    return (
        <div className="page">
            <div className="banner banner-customer">
                <div className="banner-icon">👤</div>
                <div>
                    <h2 style={{ margin: '0 0 4px', fontSize: '1.15rem' }}>Welcome, {user?.name || 'Customer'}!</h2>
                    <p style={{ margin: 0, opacity: 0.85, fontSize: '0.82rem' }}>Customer Portal</p>
                </div>
            </div>

            <div className="stat-grid">
                <div className="stat-card" style={{ gridColumn: '1 / -1', cursor: 'pointer' }} onClick={() => navigate('/devices')}>
                    <div className="stat-icon">📦</div>
                    <div className="stat-num">{stats?.stats?.totalEquipment ?? '—'}</div>
                    <div className="stat-label">My Registered Devices</div>
                </div>
            </div>

            {/* How to use */}
            <div className="card">
                <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>📱 How to Use</h3></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                        ['📋', 'View Devices', 'See all your registered equipment and their status', '/devices'],
                        ['🔍', 'Device Details', 'Click on any device to view details and service history', null],
                    ].map(([icon, title, desc, path]) => (
                        <div key={title} onClick={() => path && navigate(path)}
                            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: 'var(--bg)', borderRadius: '10px', cursor: path ? 'pointer' : 'default' }}>
                            <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                            <div>
                                <p style={{ fontWeight: '700', margin: '0 0 3px', fontSize: '0.88rem' }}>{title}</p>
                                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.78rem' }}>{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button className="btn btn-primary btn-full" onClick={() => navigate('/devices')} style={{ marginTop: '8px' }}>
                View My Devices →
            </button>
            <div style={{ height: '16px' }} />
        </div>
    );
};

export default Dashboard;
