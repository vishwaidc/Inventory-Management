import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import QRCode from 'qrcode';

const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://inventory-management-xbb6.onrender.com/api' : 'http://localhost:5000/api');

const statusClass = (s) => s === 'completed' ? 'badge-completed' : s === 'in-progress' ? 'badge-progress' : 'badge-pending';

const DeviceDetail = () => {
    const { id } = useParams();
    const { token, isMechanic, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [device, setDevice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [qrImageUrl, setQrImageUrl] = useState('');
    const [lightboxImage, setLightboxImage] = useState(null);

    const load = () => {
        setLoading(true);
        axios.get(`${API}/equipment/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => setDevice(r.data))
            .catch(e => setError(e.response?.data?.error || 'Device not found'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [id, token]);

    // Generate QR code image from the stored URL value
    useEffect(() => {
        if (device?.qr_code_value) {
            QRCode.toDataURL(device.qr_code_value, { width: 220, margin: 2 })
                .then(url => setQrImageUrl(url))
                .catch(() => setQrImageUrl(''));
        }
    }, [device?.qr_code_value]);

    const handleDelete = async () => {
        if (!confirm('Delete this device? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await axios.delete(`${API}/equipment/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            navigate('/devices');
        } catch (e) {
            setError(e.response?.data?.error || 'Delete failed');
        } finally { setDeleting(false); }
    };

    const handleGenerateReport = async (serviceId) => {
        setReportLoading(serviceId);
        setReportError('');
        setReportSuccess('');
        try {
            await downloadServiceReport(serviceId);
            setReportSuccess('✅ Report downloaded successfully!');
            setTimeout(() => setReportSuccess(''), 4000);
        } catch (e) {
            setReportError(`❌ ${e.message || 'Failed to generate report. Try again.'}`);
            setTimeout(() => setReportError(''), 5000);
        } finally {
            setReportLoading(null);
        }
    };

    if (loading) return <div className="state-center"><div className="state-icon">⏳</div><p>Loading...</p></div>;
    if (error) return <div className="page"><div className="alert alert-error">{error}</div><button className="btn btn-outline" onClick={() => navigate('/devices')}>← Back</button></div>;
    if (!device) return null;

    const isWarrantyExpired = device.warranty_expiry && new Date(device.warranty_expiry) < new Date();

    return (
        <div className="page">
            {/* Device header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate('/devices')} style={{ marginBottom: '8px' }}>← Back</button>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{device.equipment_name}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{[device.brand, device.model_number].filter(Boolean).join(' · ')}</p>
                </div>
                {isMechanic && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/log-service/${id}`)}>+ Log Service</button>
                        <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>🗑</button>
                    </div>
                )}
            </div>

            {/* Device Info Card */}
            <div className="card">
                <div className="card-header">
                    <h3 style={{ fontSize: '0.9rem' }}>📋 Device Details</h3>
                    {isMechanic && <button className="btn btn-outline btn-sm" onClick={() => navigate(`/edit-device/${id}`)}>✏️ Edit</button>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                    {[
                        ['Brand', device.brand],
                        ['Model', device.model_number],
                        ['Serial No.', device.serial_number],
                        ['Department', device.department],
                        ['Location', device.location],
                        ['Purchased', device.purchase_date],
                        ['Last Service', device.last_service_date],
                    ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label}>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2px', fontSize: '0.75rem', fontWeight: '600' }}>{label}</p>
                            <p style={{ fontWeight: '600' }}>{value}</p>
                        </div>
                    ))}
                    <div>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2px', fontSize: '0.75rem', fontWeight: '600' }}>Warranty</p>
                        <p style={{ fontWeight: '600', color: isWarrantyExpired ? 'var(--danger)' : 'inherit' }}>
                            {device.warranty_expiry || '—'} {isWarrantyExpired && '⚠ Expired'}
                        </p>
                    </div>
                    {device.customer && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2px', fontSize: '0.75rem', fontWeight: '600' }}>Customer</p>
                            <p style={{ fontWeight: '600' }}>{device.customer.name} · {device.customer.email}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* QR Code toggle */}
            <button className="btn btn-outline btn-full" onClick={() => setShowQR(!showQR)} style={{ marginBottom: '12px' }}>
                {showQR ? 'Hide QR Code' : '📱 Show QR Code'}
            </button>

            {showQR && (
                <div className="qr-container">
                    {qrImageUrl ? (
                        <>
                            <img src={qrImageUrl} alt="QR Code" style={{ width: 200, height: 200 }} />
                            <a
                                href={qrImageUrl}
                                download={`qr-${device.equipment_name}.png`}
                                className="btn btn-primary btn-sm"
                                style={{ marginTop: '8px' }}
                            >
                                ⬇ Download QR
                            </a>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
                                {device.qr_code_value}
                            </p>
                        </>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No QR code available</p>
                    )}
                </div>
            )}

            {/* Report status messages */}
            {reportSuccess && (
                <div style={{
                    background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '8px',
                    padding: '10px 14px', marginBottom: '8px', fontSize: '0.85rem', color: '#065f46'
                }}>
                    {reportSuccess}
                </div>
            )}
            {reportError && (
                <div style={{
                    background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px',
                    padding: '10px 14px', marginBottom: '8px', fontSize: '0.85rem', color: '#991b1b'
                }}>
                    {reportError}
                </div>
            )}

            {/* Service History */}
            <div className="card">
                <div className="card-header">
                    <h3 style={{ fontSize: '0.9rem' }}>🔧 Service History ({device.service_history?.length || 0})</h3>
                    {isMechanic && <button className="btn btn-success btn-sm" onClick={() => navigate(`/log-service/${id}`)}>+ Log</button>}
                </div>

                {!device.service_history?.length ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', fontSize: '0.85rem' }}>No service records yet</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {device.service_history
                            .sort((a, b) => new Date(b.service_date) - new Date(a.service_date))
                            .map(s => (
                                <div key={s.id} style={{
                                    borderLeft: `3px solid ${s.status === 'completed' ? '#059669' : s.status === 'in-progress' ? '#2563eb' : '#f59e0b'}`,
                                    paddingLeft: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <p style={{ fontWeight: '700', fontSize: '0.88rem' }}>{s.service_type || 'Service'}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            <span className={`badge ${statusClass(s.status)}`}>{s.status}</span>
                                            {/* Approval Badge */}
                                            {s.approval_status === 'pending_review' && (
                                                <span style={{ fontSize: '0.68rem', background: '#fef3c7', color: '#92400e', padding: '2px 7px', borderRadius: '99px', fontWeight: '700', border: '1px solid #fcd34d' }}>🕐 Awaiting Review</span>
                                            )}
                                            {s.approval_status === 'approved' && (
                                                <span style={{ fontSize: '0.68rem', background: '#d1fae5', color: '#065f46', padding: '2px 7px', borderRadius: '99px', fontWeight: '700', border: '1px solid #6ee7b7' }}>✅ Approved</span>
                                            )}
                                            {s.approval_status === 'rejected' && (
                                                <span style={{ fontSize: '0.68rem', background: '#fee2e2', color: '#991b1b', padding: '2px 7px', borderRadius: '99px', fontWeight: '700', border: '1px solid #fca5a5' }}>❌ Rejected</span>
                                            )}

                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                        📅 {s.service_date} · 👤 {s.technician?.name || 'Mechanic'}
                                    </p>
                                    {s.issue_reported && <p style={{ fontSize: '0.82rem', marginBottom: '4px' }}><strong>Issue:</strong> {s.issue_reported}</p>}
                                    {s.work_done && <p style={{ fontSize: '0.82rem', marginBottom: '4px' }}><strong>Work done:</strong> {s.work_done}</p>}
                                    {s.parts_replaced && <p style={{ fontSize: '0.82rem', marginBottom: '4px' }}><strong>Parts replaced:</strong> {s.parts_replaced}</p>}
                                    {s.next_service_due && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Next service: {s.next_service_due}</p>}

                                    {s.admin_note && s.approval_status === 'rejected' && (
                                        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '6px 10px', marginTop: '6px', fontSize: '0.78rem', color: '#991b1b' }}>
                                            <strong>Rejection reason:</strong> {s.admin_note}
                                        </div>
                                    )}

                                    {/* Before / After Images */}
                                    {(s.before_image_url || s.after_image_url) && (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                                            {s.before_image_url && (
                                                <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setLightboxImage({ url: s.before_image_url, label: 'Before Work' })}>
                                                    <p style={{ fontSize: '0.65rem', fontWeight: '800', color: '#ef4444', marginBottom: '3px', letterSpacing: '0.05em' }}>BEFORE</p>
                                                    <img
                                                        src={s.before_image_url}
                                                        alt="Before"
                                                        style={{ width: 80, height: 64, objectFit: 'cover', borderRadius: '6px', border: '2px solid #ef4444' }}
                                                    />
                                                </div>
                                            )}
                                            {s.after_image_url && (
                                                <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setLightboxImage({ url: s.after_image_url, label: 'After Work' })}>
                                                    <p style={{ fontSize: '0.65rem', fontWeight: '800', color: '#16a34a', marginBottom: '3px', letterSpacing: '0.05em' }}>AFTER</p>
                                                    <img
                                                        src={s.after_image_url}
                                                        alt="After"
                                                        style={{ width: 80, height: 64, objectFit: 'cover', borderRadius: '6px', border: '2px solid #16a34a' }}
                                                    />
                                                </div>
                                            )}
                                            <p style={{ fontSize: '0.7rem', color: '#6b7280', alignSelf: 'flex-end', marginBottom: '4px' }}>Tap to enlarge</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                )}
            </div>
            <div style={{ height: '16px' }} />

            {/* Lightbox */}
            {lightboxImage && (
                <div
                    onClick={() => setLightboxImage(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                        zIndex: 9999, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', padding: '24px',
                    }}
                >
                    <p style={{ color: '#fff', fontWeight: '700', marginBottom: '12px', fontSize: '1rem' }}>
                        {lightboxImage.label}
                    </p>
                    <img
                        src={lightboxImage.url}
                        alt={lightboxImage.label}
                        style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '10px', objectFit: 'contain' }}
                    />
                    <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '12px' }}>Tap anywhere to close</p>
                </div>
            )}

            {/* Spinner keyframe */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default DeviceDetail;
