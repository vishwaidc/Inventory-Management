import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://inventory-management-xbb6.onrender.com/api' : 'http://localhost:5000/api');

const EditDevice = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        equipment_name: '', brand: '', model_number: '', serial_number: '',
        purchase_date: '', warranty_expiry: '', department: '', location: '', last_service_date: ''
    });

    useEffect(() => {
        axios.get(`${API}/equipment/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => {
                const d = r.data;
                setForm({
                    equipment_name: d.equipment_name || '',
                    brand: d.brand || '',
                    model_number: d.model_number || '',
                    serial_number: d.serial_number || '',
                    purchase_date: d.purchase_date || '',
                    warranty_expiry: d.warranty_expiry || '',
                    department: d.department || '',
                    location: d.location || '',
                    last_service_date: d.last_service_date || ''
                });
            })
            .catch(() => setError('Device not found'))
            .finally(() => setLoading(false));
    }, [id, token]);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSaving(true);
        try {
            await axios.put(`${API}/equipment/${id}`, form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate(`/device/${id}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Update failed');
        } finally { setSaving(false); }
    };

    if (loading) return <div className="state-center"><div className="state-icon">⏳</div><p>Loading...</p></div>;

    return (
        <div className="page">
            <div className="banner banner-mechanic" style={{ marginBottom: '16px' }}>
                <div className="banner-icon">✏️</div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Edit Device</h2>
                    <p style={{ margin: 0, opacity: 0.85, fontSize: '0.82rem' }}>Update device information</p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="card">
                    <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>📋 Device Information</h3></div>
                    <div className="form-group">
                        <label className="form-label">Device Name *</label>
                        <input className="form-input" required value={form.equipment_name} onChange={set('equipment_name')} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group">
                            <label className="form-label">Brand</label>
                            <input className="form-input" value={form.brand} onChange={set('brand')} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Model</label>
                            <input className="form-input" value={form.model_number} onChange={set('model_number')} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Serial Number</label>
                            <input className="form-input" value={form.serial_number} onChange={set('serial_number')} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <input className="form-input" value={form.department} onChange={set('department')} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <input className="form-input" value={form.location} onChange={set('location')} />
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>📅 Dates</h3></div>
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
                            <label className="form-label">Last Service</label>
                            <input type="date" className="form-input" value={form.last_service_date} onChange={set('last_service_date')} />
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="btn btn-outline" onClick={() => navigate(`/device/${id}`)}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
                        {saving ? '⏳ Saving...' : '💾 Save Changes'}
                    </button>
                </div>
                <div style={{ height: '16px' }} />
            </form>
        </div>
    );
};

export default EditDevice;
