import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const statusClass = (s) => s === 'completed' ? 'badge-completed' : s === 'in-progress' ? 'badge-progress' : 'badge-pending';

const QRScanner = () => {
    const navigate = useNavigate();
    const { token, isMechanic } = useAuth();
    const html5QrRef = useRef(null);
    const fileInputRef = useRef(null);

    // Scanner states
    const [scanStatus, setScanStatus] = useState('idle'); // idle | starting | scanning | found | error
    const [scanError, setScanError] = useState('');

    // Device data states
    const [device, setDevice] = useState(null);
    const [loadingDevice, setLoadingDevice] = useState(false);
    const [deviceError, setDeviceError] = useState('');

    // Auto-start camera on mount
    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    // ─── CAMERA ────────────────────────────────────────────────
    const startCamera = async () => {
        setScanStatus('starting');
        setScanError('');
        setDevice(null);
        setDeviceError('');

        try {
            html5QrRef.current = new Html5Qrcode('qr-video-region');
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };

            await html5QrRef.current.start(
                { facingMode: 'environment' },
                config,
                (text) => { stopCamera(); setScanStatus('found'); fetchDevice(text); },
                () => { }
            );
            setScanStatus('scanning');
        } catch (_) {
            try {
                html5QrRef.current = new Html5Qrcode('qr-video-region');
                const config = { fps: 10, qrbox: { width: 250, height: 250 } };
                await html5QrRef.current.start(
                    { facingMode: 'user' },
                    config,
                    (text) => { stopCamera(); setScanStatus('found'); fetchDevice(text); },
                    () => { }
                );
                setScanStatus('scanning');
            } catch (err2) {
                setScanStatus('error');
                if (err2.toString().includes('Permission') || err2.toString().includes('NotAllowed')) {
                    setScanError('Camera permission denied. Use "Upload QR Image" instead.');
                } else {
                    setScanError('Camera not available. Use "Upload QR Image" instead.');
                }
            }
        }
    };

    const stopCamera = async () => {
        if (html5QrRef.current) {
            try {
                if (html5QrRef.current.isScanning) await html5QrRef.current.stop();
                html5QrRef.current.clear();
            } catch (_) { }
            html5QrRef.current = null;
        }
    };

    // ─── FILE UPLOAD ────────────────────────────────────────────
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        await stopCamera();
        setScanStatus('found');
        setScanError('');
        setDevice(null);
        setDeviceError('');

        try {
            const reader = new Html5Qrcode('qr-video-region');
            const result = await reader.scanFile(file, true);
            reader.clear();
            fetchDevice(result);
        } catch (_) {
            setScanStatus('error');
            setScanError('No QR code found in the uploaded image. Please try a clearer photo.');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ─── FETCH DEVICE FROM DB ────────────────────────────────────
    const extractEquipmentId = (text) => {
        text = text.trim();

        // URL: http://…/equipment/{uuid}
        try {
            const url = new URL(text);
            const parts = url.pathname.split('/').filter(Boolean);
            const last = parts[parts.length - 1];
            if (last && last.length === 36) return last;
        } catch (_) { }

        // Raw UUID
        if (/^[0-9a-f-]{36}$/i.test(text)) return text;

        // JSON
        try {
            const json = JSON.parse(text);
            if (json.id) return json.id;
        } catch (_) { }

        return null;
    };

    const fetchDevice = async (qrText) => {
        const equipId = extractEquipmentId(qrText);
        if (!equipId) {
            setScanStatus('error');
            setScanError('QR code is not a valid device QR. Expected a device URL or ID.');
            return;
        }

        setLoadingDevice(true);
        setDeviceError('');
        try {
            const res = await axios.get(`${API}/equipment/${equipId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDevice(res.data);
        } catch (err) {
            setDeviceError(err.response?.data?.error || 'Device not found in database.');
        } finally {
            setLoadingDevice(false);
        }
    };

    // ─── RESET ──────────────────────────────────────────────────
    const handleReset = async () => {
        await stopCamera();
        setDevice(null);
        setDeviceError('');
        setScanStatus('idle');
        setScanError('');
        const el = document.getElementById('qr-video-region');
        if (el) el.innerHTML = '';
        setTimeout(() => startCamera(), 300);
    };

    const isWarrantyExpired = device?.warranty_expiry && new Date(device.warranty_expiry) < new Date();

    return (
        <div className="page">
            {/* ── DEVICE DATA PANEL (after scan) ── */}
            {(loadingDevice || device || deviceError) ? (
                <div>
                    {/* Back / Scan Again */}
                    <button className="btn btn-outline btn-sm" onClick={handleReset} style={{ marginBottom: '14px' }}>
                        ← Scan Another
                    </button>

                    {loadingDevice && (
                        <div className="state-center"><div className="state-icon">⏳</div><p>Fetching device from database...</p></div>
                    )}

                    {deviceError && (
                        <div className="alert alert-error">{deviceError}</div>
                    )}

                    {device && !loadingDevice && (
                        <>
                            {/* Device Info */}
                            <div className="card">
                                <div className="card-header">
                                    <div>
                                        <h2 style={{ fontSize: '1.1rem', margin: '0 0 4px' }}>{device.equipment_name}</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                                            {[device.brand, device.model_number].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                    {isMechanic && (
                                        <button className="btn btn-success btn-sm" onClick={() => navigate(`/log-service/${device.id}`)}>
                                            + Log Service
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                                    {[
                                        ['Serial No.', device.serial_number],
                                        ['Department', device.department],
                                        ['Location', device.location],
                                        ['Purchased', device.purchase_date],
                                        ['Last Service', device.last_service_date],
                                    ].filter(([, v]) => v).map(([label, value]) => (
                                        <div key={label}>
                                            <p style={{ color: 'var(--text-muted)', marginBottom: '2px', fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase' }}>{label}</p>
                                            <p style={{ fontWeight: '600', margin: 0 }}>{value}</p>
                                        </div>
                                    ))}
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', marginBottom: '2px', fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase' }}>Warranty</p>
                                        <p style={{ fontWeight: '600', margin: 0, color: isWarrantyExpired ? 'var(--danger)' : 'inherit' }}>
                                            {device.warranty_expiry || '—'} {isWarrantyExpired && '⚠'}
                                        </p>
                                    </div>
                                    {device.customer && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <p style={{ color: 'var(--text-muted)', marginBottom: '2px', fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase' }}>Customer</p>
                                            <p style={{ fontWeight: '600', margin: 0 }}>{device.customer.name} · {device.customer.email}</p>
                                        </div>
                                    )}
                                </div>

                                {isMechanic && (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/device/${device.id}`)}>View Full Details</button>
                                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/edit-device/${device.id}`)}>✏️ Edit Device</button>
                                    </div>
                                )}
                            </div>

                            {/* Service History */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 style={{ fontSize: '0.9rem' }}>🔧 Service History ({device.service_history?.length || 0})</h3>
                                    {isMechanic && (
                                        <button className="btn btn-success btn-sm" onClick={() => navigate(`/log-service/${device.id}`)}>+ Log</button>
                                    )}
                                </div>

                                {!device.service_history?.length ? (
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', fontSize: '0.85rem' }}>
                                        No service records yet
                                        {isMechanic && <><br /><button className="btn btn-success btn-sm" style={{ marginTop: '10px' }} onClick={() => navigate(`/log-service/${device.id}`)}>Log First Service</button></>}
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {[...device.service_history]
                                            .sort((a, b) => new Date(b.service_date) - new Date(a.service_date))
                                            .map(s => (
                                                <div key={s.id} style={{
                                                    borderLeft: `3px solid ${s.status === 'completed' ? '#059669' : s.status === 'in-progress' ? '#2563eb' : '#f59e0b'}`,
                                                    paddingLeft: '12px', paddingBottom: '8px',
                                                    borderBottom: '1px solid var(--border)'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                        <p style={{ fontWeight: '700', fontSize: '0.88rem', margin: 0 }}>{s.service_type || 'Service'}</p>
                                                        <span className={`badge ${statusClass(s.status)}`}>{s.status}</span>
                                                    </div>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 6px' }}>
                                                        📅 {s.service_date} {s.technician?.name ? `· 👤 ${s.technician.name}` : ''}
                                                    </p>
                                                    {s.issue_reported && <p style={{ fontSize: '0.82rem', margin: '0 0 3px' }}><strong>Issue:</strong> {s.issue_reported}</p>}
                                                    {s.work_done && <p style={{ fontSize: '0.82rem', margin: '0 0 3px' }}><strong>Work done:</strong> {s.work_done}</p>}
                                                    {s.parts_replaced && <p style={{ fontSize: '0.82rem', margin: '0 0 3px' }}><strong>Parts:</strong> {s.parts_replaced}</p>}
                                                    {s.next_service_due && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Next: {s.next_service_due}</p>}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    <div style={{ height: '16px' }} />
                </div>
            ) : (
                /* ── SCANNER UI ── */
                <div>
                    <div className="banner banner-mechanic" style={{ marginBottom: '16px' }}>
                        <div className="banner-icon">📷</div>
                        <div>
                            <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Scan Device QR Code</h2>
                            <p style={{ margin: 0, opacity: 0.85, fontSize: '0.82rem' }}>Scan or upload QR to load device data from database</p>
                        </div>
                    </div>

                    {/* Status alerts */}
                    {scanStatus === 'starting' && <div className="alert alert-info" style={{ marginBottom: '12px' }}>⏳ Starting camera...</div>}
                    {scanStatus === 'scanning' && <div className="alert alert-info" style={{ marginBottom: '12px' }}>🎯 Point camera at QR code — scanning automatically</div>}
                    {scanStatus === 'found' && <div className="alert alert-success" style={{ marginBottom: '12px' }}>✅ QR detected! Fetching device data...</div>}
                    {scanStatus === 'error' && <div className="alert alert-error" style={{ marginBottom: '12px' }}>❌ {scanError}</div>}

                    {/* Camera viewport */}
                    <div style={{ background: '#000', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {scanStatus === 'starting' && (
                            <div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📷</div>
                                <p>Starting camera...</p>
                            </div>
                        )}
                        <div id="qr-video-region" style={{ width: '100%' }} />
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                        {scanStatus === 'error' && (
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleReset}>🔄 Retry Camera</button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                        <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { stopCamera(); fileInputRef.current?.click(); }}>
                            🖼 Upload QR Image
                        </button>
                        <button className="btn btn-outline btn-full" onClick={() => { stopCamera(); navigate('/devices'); }}>
                            📋 Device List
                        </button>
                    </div>

                    {/* Tips */}
                    <div className="card" style={{ marginTop: '14px' }}>
                        <h3 style={{ fontSize: '0.82rem', marginBottom: '8px', color: 'var(--text-muted)' }}>💡 How it works</h3>
                        {[
                            '📷 Camera scans QR code automatically — or upload a QR photo',
                            '🗄 Device data is fetched live from the database',
                            '🔧 Mechanic can log service directly from the scan result',
                        ].map(tip => (
                            <p key={tip} style={{ margin: '4px 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{tip}</p>
                        ))}
                    </div>
                    <div style={{ height: '16px' }} />
                </div>
            )}
        </div>
    );
};

export default QRScanner;
