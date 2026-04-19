import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://inventory-management-xbb6.onrender.com/api' : 'http://localhost:5000/api');

const AddDevice = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null); // { device, customer_created, qr }

    const [form, setForm] = useState({
        equipment_name: '', brand: '', model_number: '', serial_number: '',
        purchase_date: '', warranty_expiry: '', department: '', location: '',
        last_service_date: ''
    });

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await axios.post(`${API}/equipment`, form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add device');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="page">
                <div className="alert alert-success">✅ Device added successfully!</div>


                {/* QR Code */}
                <div className="qr-container">
                    <p style={{ fontWeight: '700', marginBottom: '12px', color: 'var(--text)' }}>📱 Device QR Code</p>
                    <img src={success.qr_code_image} alt="QR Code" style={{ width: 220, height: 220 }} />
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                        Scan to view/update device
                    </p>
                    <a
                        href={success.qr_code_image}
                        download={`qr-${success.equipment_name}.png`}
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: '10px' }}
                    >
                        ⬇ Download QR
                    </a>
                </div>

                {/* Device Summary */}
                <div className="card">
                    <h3 style={{ marginBottom: '12px' }}>{success.equipment_name}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                        {success.brand && <><span style={{ color: 'var(--text-muted)' }}>Brand</span><span style={{ fontWeight: '600' }}>{success.brand}</span></>}
                        {success.model_number && <><span style={{ color: 'var(--text-muted)' }}>Model</span><span style={{ fontWeight: '600' }}>{success.model_number}</span></>}
                        {success.serial_number && <><span style={{ color: 'var(--text-muted)' }}>Serial</span><span style={{ fontWeight: '600' }}>{success.serial_number}</span></>}
                        {success.warranty_expiry && <><span style={{ color: 'var(--text-muted)' }}>Warranty</span><span style={{ fontWeight: '600' }}>{success.warranty_expiry}</span></>}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button className="btn btn-outline btn-full" onClick={() => { setSuccess(null); setForm({ equipment_name: '', brand: '', model_number: '', serial_number: '', purchase_date: '', warranty_expiry: '', department: '', location: '', last_service_date: '' }); }}>
                        ➕ Add Another
                    </button>
                    <button className="btn btn-primary btn-full" onClick={() => navigate(`/device/${success.id}`)}>
                        View Device
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="banner banner-mechanic" style={{ marginBottom: '16px' }}>
                <div className="banner-icon">🔧</div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Add New Device</h2>
                    <p style={{ margin: 0, opacity: 0.85, fontSize: '0.82rem' }}>Fill in device details</p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
                {/* Device Info */}
                <div className="card">
                    <div className="card-header"><h3 style={{ fontSize: '0.95rem' }}>📋 Device Information</h3></div>

                    <div className="form-group">
                        <label className="form-label">Device Name *</label>
                        <input className="form-input" required value={form.equipment_name} onChange={set('equipment_name')} placeholder="e.g. ECG Monitor" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group">
                            <label className="form-label">Brand</label>
                            <input className="form-input" value={form.brand} onChange={set('brand')} placeholder="e.g. Philips" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Model Number</label>
                            <input className="form-input" value={form.model_number} onChange={set('model_number')} placeholder="e.g. ECG-100X" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Serial Number</label>
                        <input className="form-input" value={form.serial_number} onChange={set('serial_number')} placeholder="SN-XXXXXXXX" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <input className="form-input" value={form.department} onChange={set('department')} placeholder="e.g. Cardiology" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <input className="form-input" value={form.location} onChange={set('location')} placeholder="e.g. Room 204" />
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className="card">
                    <div className="card-header"><h3 style={{ fontSize: '0.95rem' }}>📅 Dates</h3></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group">
                            <label className="form-label">Purchase Date</label>
                            <input type="date" className="form-input" value={form.purchase_date} onChange={set('purchase_date')} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Warranty Expiry</label>
                            <input type="date" className="form-input" value={form.warranty_expiry} onChange={set('warranty_expiry')} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last Service Date</label>
                            <input type="date" className="form-input" value={form.last_service_date} onChange={set('last_service_date')} />
                        </div>
                    </div>
                </div>


                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? '⏳ Adding Device...' : '✅ Add Device & Generate QR'}
                </button>
                <div style={{ height: '16px' }} />
            </form>
        </div>
    );
};

export default AddDevice;
