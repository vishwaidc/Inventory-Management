import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://inventory-management-xbb6.onrender.com/api' : 'http://localhost:5000/api');

const CustomerLanding = () => {
    const navigate = useNavigate();
    const [scanning, setScanning] = useState(false);
    const [manualId, setManualId] = useState('');
    const [error, setError] = useState('');
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Open camera and scan using jsQR (loaded via CDN) or manual URL paste
    const startCamera = async () => {
        setError('');
        setScanning(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch {
            setError('Camera access denied. Please paste the device URL below.');
            setScanning(false);
        }
    };

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setScanning(false);
    };

    // Extract equipment ID from URL and navigate
    const handleManualUrl = (e) => {
        e.preventDefault();
        const val = manualId.trim();
        if (!val) return;
        // Try to extract ID from full URL or treat as raw ID
        const match = val.match(/\/equipment\/([^\/\s?]+)/);
        const equipId = match ? match[1] : val;
        navigate(`/equipment/${equipId}`);
    };

    return (
        <div style={styles.shell}>
            {/* ── Header ── */}
            <header style={styles.header}>
                <div style={styles.headerBrand}>
                    <span style={{ fontSize: '1.4rem' }}>⚕</span>
                    <span style={styles.headerTitle}>MedEquip Track</span>
                </div>
                <button onClick={() => navigate('/login')} style={styles.loginBtn}>
                    🔐 Staff Login
                </button>
            </header>

            <div style={styles.page}>
                {/* ── Hero ── */}
                <div style={styles.hero}>
                    <div style={styles.heroEmoji}>📱</div>
                    <h1 style={styles.heroTitle}>Scan Equipment QR Code</h1>
                    <p style={styles.heroSub}>
                        Instantly view service history and device details for any registered medical equipment
                    </p>
                </div>

                {error && (
                    <div style={styles.errorBox}>{error}</div>
                )}

                {/* ── Camera Scanner ── */}
                <div style={styles.card}>
                    <p style={styles.sectionTitle}>📷 Camera Scan</p>

                    {!scanning ? (
                        <button onClick={startCamera} style={styles.scanBtn}>
                            📷 Open Camera & Scan QR
                        </button>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <div style={styles.videoWrapper}>
                                <video
                                    ref={videoRef}
                                    style={styles.video}
                                    playsInline
                                    muted
                                />
                                <div style={styles.scanFrame} />
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '8px' }}>
                                Point camera at the QR code on the equipment label
                            </p>
                            <button onClick={stopCamera} style={styles.cancelBtn}>
                                ✕ Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Manual URL ── */}
                <div style={styles.card}>
                    <p style={styles.sectionTitle}>🔗 Enter Device ID or URL</p>
                    <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '12px' }}>
                        Can't scan? Paste the QR code URL or device ID below.
                    </p>
                    <form onSubmit={handleManualUrl} style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={manualId}
                            onChange={e => setManualId(e.target.value)}
                            placeholder="Device ID or full URL..."
                            style={styles.input}
                        />
                        <button type="submit" style={styles.goBtn}>Go →</button>
                    </form>
                </div>

                {/* ── Info Cards ── */}
                <div style={styles.infoGrid}>
                    {[
                        { icon: '📋', title: 'Service History', desc: 'View all completed maintenance and repair records' },
                        { icon: '🔍', title: 'Device Details', desc: 'Brand, model, serial number, warranty status' },
                        { icon: '📅', title: 'Next Service', desc: 'Know when the next maintenance is scheduled' },
                    ].map(item => (
                        <div key={item.title} style={styles.infoCard}>
                            <span style={{ fontSize: '1.6rem' }}>{item.icon}</span>
                            <p style={styles.infoTitle}>{item.title}</p>
                            <p style={styles.infoDesc}>{item.desc}</p>
                        </div>
                    ))}
                </div>

                <p style={styles.footerNote}>
                    Medical Equipment Maintenance System · Staff?{' '}
                    <span onClick={() => navigate('/login')} style={{ color: '#6366f1', cursor: 'pointer', fontWeight: '600' }}>
                        Sign in here
                    </span>
                </p>
            </div>
        </div>
    );
};

const styles = {
    shell: { minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, -apple-system, sans-serif' },
    header: {
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '12px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        position: 'sticky', top: 0, zIndex: 100,
    },
    headerBrand: { display: 'flex', alignItems: 'center', gap: '8px' },
    headerTitle: { fontWeight: '800', fontSize: '1rem', color: '#1e293b' },
    loginBtn: {
        background: 'linear-gradient(135deg,#667eea,#764ba2)',
        color: '#fff', border: 'none', borderRadius: '8px',
        padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
    },
    page: { maxWidth: '520px', margin: '0 auto', padding: '20px 16px' },
    hero: {
        textAlign: 'center', marginBottom: '20px',
        background: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
        borderRadius: '16px', padding: '28px 20px',
        boxShadow: '0 6px 24px rgba(37,99,235,0.28)',
    },
    heroEmoji: {
        fontSize: '3rem', marginBottom: '10px',
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
    },
    heroTitle: { margin: '0 0 8px', fontSize: '1.4rem', fontWeight: '800', color: '#fff' },
    heroSub: { margin: 0, fontSize: '0.88rem', color: '#bfdbfe', lineHeight: 1.5 },
    card: {
        background: '#fff', borderRadius: '14px', padding: '18px',
        marginBottom: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
    },
    sectionTitle: { fontWeight: '700', fontSize: '0.9rem', color: '#374151', marginBottom: '12px' },
    scanBtn: {
        width: '100%', padding: '14px', background: 'linear-gradient(135deg,#6366f1,#7c3aed)',
        color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700',
        fontSize: '1rem', cursor: 'pointer',
    },
    videoWrapper: { position: 'relative', display: 'inline-block', borderRadius: '10px', overflow: 'hidden' },
    video: { width: '100%', maxWidth: '300px', borderRadius: '10px', display: 'block' },
    scanFrame: {
        position: 'absolute', inset: '20px', border: '2px solid #6366f1',
        borderRadius: '8px', pointerEvents: 'none',
    },
    cancelBtn: {
        marginTop: '10px', padding: '8px 20px', background: '#f3f4f6',
        border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer',
        color: '#374151', fontWeight: '600', fontSize: '0.85rem',
    },
    input: {
        flex: 1, padding: '10px 12px', borderRadius: '8px',
        border: '1.5px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', color: '#1e293b',
    },
    goBtn: {
        padding: '10px 18px', background: '#6366f1', color: '#fff',
        border: 'none', borderRadius: '8px', fontWeight: '700',
        cursor: 'pointer', fontSize: '0.9rem',
    },
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' },
    infoCard: {
        background: '#fff', borderRadius: '12px', padding: '14px 10px',
        textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    },
    infoTitle: { fontWeight: '700', fontSize: '0.78rem', color: '#374151', margin: '6px 0 3px' },
    infoDesc: { fontSize: '0.7rem', color: '#6b7280', lineHeight: 1.4, margin: 0 },
    errorBox: {
        background: '#fee2e2', color: '#991b1b', borderRadius: '10px',
        padding: '10px 14px', fontSize: '0.85rem', marginBottom: '12px',
    },
    footerNote: { textAlign: 'center', fontSize: '0.78rem', color: '#9ca3af', marginTop: '4px' },
};

export default CustomerLanding;
