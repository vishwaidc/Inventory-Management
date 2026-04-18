import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { uploadServiceImage } from '../api/uploadApi';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// ── Image Upload Card ────────────────────────────────────────────────────────
const ImageUploadCard = ({ label, emoji, borderColor, preview, onFile, onRemove, uploading }) => {
    const inputRef = useRef();

    return (
        <div style={{
            border: `2px dashed ${preview ? borderColor : '#d1d5db'}`,
            borderRadius: '12px',
            padding: '14px',
            textAlign: 'center',
            background: preview ? `${borderColor}10` : '#f9fafb',
            position: 'relative',
            transition: 'all 0.2s',
        }}>
            <p style={{ fontWeight: '700', fontSize: '0.82rem', marginBottom: '8px', color: borderColor }}>
                {emoji} {label}
            </p>

            {preview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                        src={preview}
                        alt={label}
                        style={{
                            width: '100%', maxHeight: '160px', objectFit: 'cover',
                            borderRadius: '8px', border: `2px solid ${borderColor}`
                        }}
                    />
                    <button
                        type="button"
                        onClick={onRemove}
                        style={{
                            position: 'absolute', top: '-8px', right: '-8px',
                            background: '#ef4444', color: '#fff', border: 'none',
                            borderRadius: '50%', width: '22px', height: '22px',
                            cursor: 'pointer', fontSize: '12px', lineHeight: '22px',
                            fontWeight: '700', padding: 0,
                        }}
                    >✕</button>
                    {uploading && (
                        <div style={{
                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '700' }}>Uploading...</span>
                        </div>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    style={{
                        background: 'transparent', border: `1px solid ${borderColor}`,
                        borderRadius: '8px', color: borderColor, padding: '8px 16px',
                        cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600',
                    }}
                >
                    📎 Choose Photo
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFile(file);
                    e.target.value = '';
                }}
            />

            <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '6px' }}>
                {preview ? 'Photo selected ✓' : 'Camera or gallery · Max 5MB'}
            </p>
        </div>
    );
};

// ── Main Component ───────────────────────────────────────────────────────────
const LogService = () => {
    const { id } = useParams();
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        service_type: 'General Service',
        issue_reported: '',
        work_done: '',
        parts_replaced: '',
        status: 'completed',
        next_service_due: ''
    });

    // Image states
    const [beforeFile, setBeforeFile] = useState(null);
    const [afterFile, setAfterFile] = useState(null);
    const [beforePreview, setBeforePreview] = useState('');
    const [afterPreview, setAfterPreview] = useState('');
    const [uploadingBefore, setUploadingBefore] = useState(false);
    const [uploadingAfter, setUploadingAfter] = useState(false);
    const [beforeUrl, setBeforeUrl] = useState('');
    const [afterUrl, setAfterUrl] = useState('');

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleImageFile = async (file, type) => {
        const preview = URL.createObjectURL(file);
        if (type === 'before') {
            setBeforeFile(file);
            setBeforePreview(preview);
            setUploadingBefore(true);
            try {
                const url = await uploadServiceImage(file);
                setBeforeUrl(url);
            } catch (e) {
                setError(`Before image upload failed: ${e.message}`);
                setBeforeFile(null); setBeforePreview('');
            } finally { setUploadingBefore(false); }
        } else {
            setAfterFile(file);
            setAfterPreview(preview);
            setUploadingAfter(true);
            try {
                const url = await uploadServiceImage(file);
                setAfterUrl(url);
            } catch (e) {
                setError(`After image upload failed: ${e.message}`);
                setAfterFile(null); setAfterPreview('');
            } finally { setUploadingAfter(false); }
        }
    };

    const removeImage = (type) => {
        if (type === 'before') {
            setBeforeFile(null); setBeforePreview(''); setBeforeUrl('');
        } else {
            setAfterFile(null); setAfterPreview(''); setAfterUrl('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (uploadingBefore || uploadingAfter) {
            setError('Please wait — images are still uploading.');
            return;
        }
        setError(''); setLoading(true);
        try {
            await axios.post(`${API}/service`, {
                equipment_id: id,
                ...form,
                before_image_url: beforeUrl || null,
                after_image_url: afterUrl || null,
            }, { headers: { Authorization: `Bearer ${token}` } });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to log service');
        } finally { setLoading(false); }
    };

    const resetForm = () => {
        setSuccess(false);
        setForm({ service_type: 'General Service', issue_reported: '', work_done: '', parts_replaced: '', status: 'completed', next_service_due: '' });
        setBeforeFile(null); setBeforePreview(''); setBeforeUrl('');
        setAfterFile(null); setAfterPreview(''); setAfterUrl('');
        setError('');
    };

    if (success) {
        return (
            <div className="page">
                <div className="state-center">
                    <div className="state-icon">✅</div>
                    <h2 style={{ color: 'var(--secondary)' }}>Service Logged!</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Service record has been saved successfully.</p>
                    {(beforeUrl || afterUrl) && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'center' }}>
                            {beforeUrl && (
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: '700', marginBottom: '4px' }}>BEFORE</p>
                                    <img src={beforeUrl} alt="Before" style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: '8px', border: '2px solid #ef4444' }} />
                                </div>
                            )}
                            {afterUrl && (
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: '700', marginBottom: '4px' }}>AFTER</p>
                                    <img src={afterUrl} alt="After" style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: '8px', border: '2px solid #16a34a' }} />
                                </div>
                            )}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button className="btn btn-outline" onClick={resetForm}>Log Another</button>
                        <button className="btn btn-primary" onClick={() => navigate(`/device/${id}`)}>View Device</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="banner banner-mechanic" style={{ marginBottom: '16px' }}>
                <div className="banner-icon">🔧</div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Log Service / Repair</h2>
                    <p style={{ margin: 0, opacity: 0.85, fontSize: '0.82rem' }}>Logged by: {user?.name || user?.email}</p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
                {/* Before / After Photo Verification */}
                <div className="card" style={{ marginBottom: '12px' }}>
                    <div className="card-header">
                        <h3 style={{ fontSize: '0.9rem' }}>📸 Work Verification Photos</h3>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Optional · prevents fake logs</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <ImageUploadCard
                            label="Before Work"
                            emoji="🔴"
                            borderColor="#ef4444"
                            preview={beforePreview}
                            onFile={(f) => handleImageFile(f, 'before')}
                            onRemove={() => removeImage('before')}
                            uploading={uploadingBefore}
                        />
                        <ImageUploadCard
                            label="After Work"
                            emoji="🟢"
                            borderColor="#16a34a"
                            preview={afterPreview}
                            onFile={(f) => handleImageFile(f, 'after')}
                            onRemove={() => removeImage('after')}
                            uploading={uploadingAfter}
                        />
                    </div>
                    {(beforeFile || afterFile) && (
                        <p style={{ fontSize: '0.73rem', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
                            ℹ️ Photos are uploaded instantly and saved with the service record.
                        </p>
                    )}
                </div>

                {/* Service Details */}
                <div className="card">
                    <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>🛠 Service Details</h3></div>

                    <div className="form-group">
                        <label className="form-label">Service Type</label>
                        <select className="form-select" value={form.service_type} onChange={set('service_type')}>
                            <option>General Service</option>
                            <option>Preventive Maintenance</option>
                            <option>Corrective Repair</option>
                            <option>Parts Replacement</option>
                            <option>Calibration</option>
                            <option>Inspection</option>
                            <option>Emergency Repair</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Issue Reported</label>
                        <textarea className="form-textarea" value={form.issue_reported} onChange={set('issue_reported')} placeholder="Describe the problem or reason for service..." />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Work Done</label>
                        <textarea className="form-textarea" value={form.work_done} onChange={set('work_done')} placeholder="What was done during this service..." />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Parts Replaced</label>
                        <input className="form-input" value={form.parts_replaced} onChange={set('parts_replaced')} placeholder="e.g. Battery, Sensor Probe, Cable..." />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-select" value={form.status} onChange={set('status')}>
                                <option value="completed">Completed</option>
                                <option value="in-progress">In Progress</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Next Service Due</label>
                            <input type="date" className="form-input" value={form.next_service_due} onChange={set('next_service_due')} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="btn btn-outline" onClick={() => navigate(`/device/${id}`)}>Cancel</button>
                    <button
                        type="submit"
                        className="btn btn-success btn-full"
                        disabled={loading || uploadingBefore || uploadingAfter}
                    >
                        {(uploadingBefore || uploadingAfter) ? '⏳ Uploading photos...' : loading ? '⏳ Saving...' : '✅ Save Service Record'}
                    </button>
                </div>
                <div style={{ height: '16px' }} />
            </form>
        </div>
    );
};

export default LogService;
