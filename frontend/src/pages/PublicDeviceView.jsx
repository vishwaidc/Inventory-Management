import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://inventory-management-xbb6.onrender.com/api' : 'http://localhost:5000/api');

const statusColor = {
    completed: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
    'in-progress': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
    pending: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
};

const PublicDeviceView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [device, setDevice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedLog, setExpandedLog] = useState(null);

    useEffect(() => {
        fetch(`${API}/public/equipment/${id}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) setError(data.error);
                else setDevice(data);
            })
            .catch(() => setError('Failed to load device information.'))
            .finally(() => setLoading(false));
    }, [id]);

    const isExpired = device?.warranty_expiry && new Date(device.warranty_expiry) < new Date();

    if (loading) return (
        <div style={styles.centered}>
            <div style={styles.spinner} />
            <p style={{ color: '#6b7280', marginTop: '16px' }}>Loading device info...</p>
        </div>
    );

    if (error) return (
        <div style={styles.centered}>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <h2 style={{ color: '#374151', marginBottom: '8px' }}>Device Not Found</h2>
            <p style={{ color: '#6b7280' }}>{error}</p>
        </div>
    );

    return (
        <div style={styles.shell}>
            {/* ── Top Bar ── */}
            <header style={styles.header}>
                <div style={styles.headerBrand}>
                    <span style={{ fontSize: '1.3rem' }}>⚕</span>
                    <span style={styles.headerTitle}>MedEquip Track</span>
                </div>
                <button
                    onClick={() => navigate('/login')}
                    style={styles.loginBtn}
                >
                    🔐 Login
                </button>
            </header>

            <div style={styles.page}>
                {/* ── Hero Banner ── */}
                <div style={styles.hero}>
                    <div style={styles.heroIcon}>🏥</div>
                    <div>
                        <h1 style={styles.heroTitle}>{device.equipment_name}</h1>
                        <p style={styles.heroSub}>{device.brand} · {device.model_number}</p>
                    </div>
                </div>

                {/* ── Device Info ── */}
                <div style={styles.card}>
                    <p style={styles.sectionTitle}>📋 Device Information</p>
                    <div style={styles.grid2}>
                        {[
                            ['Serial No.', device.serial_number],
                            ['Department', device.department],
                            ['Location', device.location],
                            ['Purchased', device.purchase_date],
                            ['Last Service', device.last_service_date],
                        ].filter(([, v]) => v).map(([label, value]) => (
                            <div key={label}>
                                <p style={styles.fieldLabel}>{label}</p>
                                <p style={styles.fieldValue}>{value}</p>
                            </div>
                        ))}
                        <div>
                            <p style={styles.fieldLabel}>Warranty</p>
                            <p style={{ ...styles.fieldValue, color: isExpired ? '#ef4444' : '#059669' }}>
                                {device.warranty_expiry || '—'} {isExpired ? '⚠ Expired' : '✓ Valid'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Service History ── */}
                <div style={styles.card}>
                    <p style={styles.sectionTitle}>🔧 Service History ({device.service_history?.length || 0} records)</p>

                    {(!device.service_history || device.service_history.length === 0) ? (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af' }}>
                            <p style={{ fontSize: '2rem' }}>📭</p>
                            <p style={{ fontSize: '0.85rem' }}>No approved service records yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {device.service_history.map(s => {
                                const sc = statusColor[s.status] || statusColor.pending;
                                const isOpen = expandedLog === s.id;
                                return (
                                    <div
                                        key={s.id}
                                        style={{ ...styles.logCard, borderLeftColor: sc.border }}
                                        onClick={() => setExpandedLog(isOpen ? null : s.id)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <p style={{ fontWeight: '700', fontSize: '0.88rem', marginBottom: '2px' }}>
                                                    {s.service_type}
                                                </p>
                                                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                    📅 {s.service_date} · 👷 {s.technician?.name || 'Technician'}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '0.72rem', background: sc.bg, color: sc.text, padding: '3px 9px', borderRadius: '99px', fontWeight: '700', border: `1px solid ${sc.border}` }}>
                                                    {s.status}
                                                </span>
                                                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{isOpen ? '▲' : '▼'}</span>
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <div style={{ marginTop: '10px', borderTop: '1px solid #f0f0f0', paddingTop: '10px', fontSize: '0.82rem', color: '#374151' }}>
                                                {s.work_done && <p style={{ marginBottom: '4px' }}><strong>Work done:</strong> {s.work_done}</p>}
                                                {s.parts_replaced && <p style={{ marginBottom: '4px' }}><strong>Parts replaced:</strong> {s.parts_replaced}</p>}
                                                {s.next_service_due && (
                                                    <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '4px' }}>
                                                        🗓 Next service due: {s.next_service_due}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Footer note ── */}
                <p style={styles.footerNote}>
                    This is a read-only public view. For full access, staff should{' '}
                    <span onClick={() => navigate('/login')} style={{ color: '#6366f1', fontWeight: '600', cursor: 'pointer' }}>
                        log in
                    </span>.
                </p>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

const styles = {
    shell: { minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, sans-serif' },
    header: {
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    },
    headerBrand: { display: 'flex', alignItems: 'center', gap: '8px' },
    headerTitle: { fontWeight: '700', fontSize: '1rem', color: '#1e293b' },
    loginBtn: {
        background: 'linear-gradient(135deg,#667eea,#764ba2)',
        color: '#fff', border: 'none', borderRadius: '8px',
        padding: '8px 16px', cursor: 'pointer', fontWeight: '600',
        fontSize: '0.85rem',
    },
    page: { maxWidth: '600px', margin: '0 auto', padding: '16px' },
    hero: {
        background: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
        borderRadius: '14px', padding: '20px 18px', marginBottom: '14px',
        display: 'flex', alignItems: 'center', gap: '14px',
        boxShadow: '0 4px 20px rgba(37,99,235,0.25)',
    },
    heroIcon: {
        fontSize: '2.5rem', background: 'rgba(255,255,255,0.15)',
        borderRadius: '12px', width: '52px', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    heroTitle: { margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#fff' },
    heroSub: { margin: '3px 0 0', fontSize: '0.82rem', color: '#bfdbfe' },
    card: {
        background: '#fff', borderRadius: '12px', padding: '16px',
        marginBottom: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
    },
    sectionTitle: {
        fontWeight: '700', fontSize: '0.9rem', color: '#374151',
        marginBottom: '12px', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px',
    },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    fieldLabel: { fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.04em', marginBottom: '3px', textTransform: 'uppercase' },
    fieldValue: { fontWeight: '600', fontSize: '0.88rem', color: '#1f2937' },
    logCard: {
        border: '1px solid #e5e7eb', borderLeft: '4px solid #93c5fd',
        borderRadius: '8px', padding: '12px', cursor: 'pointer',
        transition: 'box-shadow 0.15s',
    },
    footerNote: {
        textAlign: 'center', fontSize: '0.78rem', color: '#9ca3af', marginTop: '8px',
    },
    centered: {
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px',
    },
    spinner: {
        width: '40px', height: '40px', border: '4px solid #e5e7eb',
        borderTop: '4px solid #6366f1', borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
    },
};

export default PublicDeviceView;
