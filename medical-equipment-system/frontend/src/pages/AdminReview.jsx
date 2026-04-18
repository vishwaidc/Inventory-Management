import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const statusColor = { completed: '#059669', 'in-progress': '#2563eb', pending: '#f59e0b' };

const AdminReview = () => {
    const { token, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null); // serviceId being actioned
    const [rejectId, setRejectId] = useState(null);
    const [rejectNote, setRejectNote] = useState('');
    const [lightbox, setLightbox] = useState(null);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/service/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(data);
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to load pending logs');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchPending(); }, [token]);

    if (!isAdmin) return (
        <div className="page">
            <div className="alert alert-error">⛔ Admin access required.</div>
            <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>← Home</button>
        </div>
    );

    const handleApprove = async (id) => {
        setActionLoading(id);
        try {
            await axios.patch(`${API}/service/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(logs.filter(l => l.id !== id));
        } catch (e) { setError(e.response?.data?.error || 'Approve failed'); }
        finally { setActionLoading(null); }
    };

    const handleReject = async () => {
        if (!rejectId) return;
        setActionLoading(rejectId);
        try {
            await axios.patch(`${API}/service/${rejectId}/reject`, { admin_note: rejectNote || 'Rejected by admin' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(logs.filter(l => l.id !== rejectId));
            setRejectId(null); setRejectNote('');
        } catch (e) { setError(e.response?.data?.error || 'Reject failed'); }
        finally { setActionLoading(null); }
    };

    if (loading) return <div className="state-center"><div className="state-icon">⏳</div><p>Loading pending logs...</p></div>;

    return (
        <div className="page">
            <div className="banner" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', marginBottom: '16px', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '2rem' }}>🛡️</div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Admin Review Panel</h2>
                    <p style={{ margin: 0, opacity: 0.85, fontSize: '0.82rem', color: '#e0e7ff' }}>
                        {logs.length} log{logs.length !== 1 ? 's' : ''} awaiting review
                    </p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {logs.length === 0 ? (
                <div className="state-center">
                    <div className="state-icon">✅</div>
                    <h3>All caught up!</h3>
                    <p style={{ color: 'var(--text-muted)' }}>No pending service logs to review.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {logs.map(log => (
                        <div key={log.id} className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                            {/* Equipment */}
                            <div style={{ background: '#fef9c3', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px' }}>
                                <p style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '2px' }}>
                                    🔧 {log.equipment?.equipment_name}
                                    <span style={{ fontWeight: '400', color: '#6b7280', fontSize: '0.8rem' }}> · {log.equipment?.brand} {log.equipment?.model_number}</span>
                                </p>
                                <p style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                                    SN: {log.equipment?.serial_number || '—'} · {log.equipment?.department} · {log.equipment?.location}
                                </p>
                            </div>

                            {/* Service Info */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem', marginBottom: '10px' }}>
                                <div>
                                    <p style={{ color: '#6b7280', fontSize: '0.72rem', fontWeight: '700' }}>SERVICE TYPE</p>
                                    <p style={{ fontWeight: '600' }}>{log.service_type || '—'}</p>
                                </div>
                                <div>
                                    <p style={{ color: '#6b7280', fontSize: '0.72rem', fontWeight: '700' }}>TECHNICIAN</p>
                                    <p style={{ fontWeight: '600' }}>{log.technician?.name || '—'}</p>
                                </div>
                                <div>
                                    <p style={{ color: '#6b7280', fontSize: '0.72rem', fontWeight: '700' }}>STATUS</p>
                                    <p style={{ fontWeight: '600', color: statusColor[log.status] || '#374151' }}>{log.status}</p>
                                </div>
                                <div>
                                    <p style={{ color: '#6b7280', fontSize: '0.72rem', fontWeight: '700' }}>DATE</p>
                                    <p style={{ fontWeight: '600' }}>{log.service_date}</p>
                                </div>
                            </div>

                            {log.issue_reported && <p style={{ fontSize: '0.82rem', marginBottom: '4px' }}><strong>Issue:</strong> {log.issue_reported}</p>}
                            {log.work_done && <p style={{ fontSize: '0.82rem', marginBottom: '4px' }}><strong>Work Done:</strong> {log.work_done}</p>}
                            {log.parts_replaced && <p style={{ fontSize: '0.82rem', marginBottom: '8px' }}><strong>Parts:</strong> {log.parts_replaced}</p>}

                            {/* Before / After Images */}
                            {(log.before_image_url || log.after_image_url) && (
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                    {log.before_image_url && (
                                        <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setLightbox({ url: log.before_image_url, label: 'Before Work' })}>
                                            <p style={{ fontSize: '0.65rem', fontWeight: '800', color: '#ef4444', marginBottom: '3px' }}>BEFORE</p>
                                            <img src={log.before_image_url} alt="Before" style={{ width: 90, height: 72, objectFit: 'cover', borderRadius: '6px', border: '2px solid #ef4444' }} />
                                        </div>
                                    )}
                                    {log.after_image_url && (
                                        <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setLightbox({ url: log.after_image_url, label: 'After Work' })}>
                                            <p style={{ fontSize: '0.65rem', fontWeight: '800', color: '#16a34a', marginBottom: '3px' }}>AFTER</p>
                                            <img src={log.after_image_url} alt="After" style={{ width: 90, height: 72, objectFit: 'cover', borderRadius: '6px', border: '2px solid #16a34a' }} />
                                        </div>
                                    )}
                                    <p style={{ fontSize: '0.7rem', color: '#9ca3af', alignSelf: 'flex-end', marginBottom: '4px' }}>Tap to enlarge</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => handleApprove(log.id)}
                                    disabled={actionLoading === log.id}
                                    style={{
                                        flex: 1, background: '#059669', color: '#fff', border: 'none',
                                        borderRadius: '8px', padding: '10px', fontWeight: '700',
                                        cursor: actionLoading === log.id ? 'not-allowed' : 'pointer',
                                        opacity: actionLoading === log.id ? 0.7 : 1, fontSize: '0.88rem'
                                    }}
                                >
                                    {actionLoading === log.id ? '⏳' : '✅ Approve'}
                                </button>
                                <button
                                    onClick={() => { setRejectId(log.id); setRejectNote(''); }}
                                    disabled={actionLoading === log.id}
                                    style={{
                                        flex: 1, background: 'transparent', color: '#ef4444',
                                        border: '1px solid #ef4444', borderRadius: '8px', padding: '10px',
                                        fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem'
                                    }}
                                >
                                    ❌ Reject
                                </button>
                            </div>

                            {/* View Device Link */}
                            <button
                                onClick={() => navigate(`/device/${log.equipment_id}`)}
                                style={{ marginTop: '8px', background: 'transparent', border: 'none', color: '#6366f1', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                            >
                                🔗 View Device
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            {rejectId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '400px' }}>
                        <h3 style={{ marginBottom: '12px', fontSize: '1rem' }}>❌ Reject Service Log</h3>
                        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '12px' }}>Provide a reason for rejection (shown to the mechanic):</p>
                        <textarea
                            value={rejectNote}
                            onChange={e => setRejectNote(e.target.value)}
                            placeholder="e.g. Insufficient work description, missing parts information..."
                            style={{ width: '100%', minHeight: '90px', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                            <button onClick={() => setRejectId(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                            <button onClick={handleReject} disabled={actionLoading === rejectId} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700' }}>
                                {actionLoading === rejectId ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightbox && (
                <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <p style={{ color: '#fff', fontWeight: '700', marginBottom: '12px' }}>{lightbox.label}</p>
                    <img src={lightbox.url} alt={lightbox.label} style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '10px' }} />
                    <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '12px' }}>Tap to close</p>
                </div>
            )}
        </div>
    );
};

export default AdminReview;
