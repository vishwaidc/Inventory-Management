import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const DeviceList = () => {
    const { token, isMechanic } = useAuth();
    const navigate = useNavigate();
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get(`${API}/equipment`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => setDevices(r.data))
            .catch(e => setError(e.response?.data?.error || 'Failed to load devices'))
            .finally(() => setLoading(false));
    }, [token]);

    const filtered = devices.filter(d =>
        d.equipment_name?.toLowerCase().includes(search.toLowerCase()) ||
        d.brand?.toLowerCase().includes(search.toLowerCase()) ||
        d.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
        d.customer?.email?.toLowerCase().includes(search.toLowerCase())
    );

    const getLastStatus = (d) => {
        if (!d.service_history?.length) return null;
        return d.service_history[0].status;
    };

    if (loading) return (
        <div className="state-center">
            <div className="state-icon">⏳</div>
            <p>Loading devices...</p>
        </div>
    );

    return (
        <div className="page">
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                    {isMechanic ? '🔧 All Devices' : '📋 My Devices'}
                </h2>
                {isMechanic && (
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/add-device')}>
                        ➕ Add Device
                    </button>
                )}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Search */}
            <input
                className="form-input"
                placeholder="🔍 Search by name, brand, serial no..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ marginBottom: '14px' }}
            />

            {filtered.length === 0 ? (
                <div className="state-center">
                    <div className="state-icon">📦</div>
                    <p>{devices.length === 0 ? 'No devices added yet' : 'No results found'}</p>
                    {isMechanic && devices.length === 0 && (
                        <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/add-device')}>
                            ➕ Add First Device
                        </button>
                    )}
                </div>
            ) : (
                filtered.map(d => {
                    const status = getLastStatus(d);
                    const isOverdue = d.warranty_expiry && new Date(d.warranty_expiry) < new Date();
                    return (
                        <div key={d.id} className="device-item" onClick={() => navigate(`/device/${d.id}`)}>
                            <div className="device-item-info">
                                <h3>{d.equipment_name}</h3>
                                <p>{[d.brand, d.model_number, d.serial_number].filter(Boolean).join(' · ')}</p>
                                {isMechanic && d.customer?.email && (
                                    <p style={{ marginTop: '2px' }}>👤 {d.customer.email}</p>
                                )}
                                {d.last_service_date && (
                                    <p>🔧 Last: {d.last_service_date}</p>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0, marginLeft: '12px' }}>
                                {status && (
                                    <span className={`badge badge-${status === 'completed' ? 'completed' : status === 'in-progress' ? 'progress' : 'pending'}`}>
                                        {status}
                                    </span>
                                )}
                                {isOverdue && <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>⚠ Expired</span>}
                                <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>›</span>
                            </div>
                        </div>
                    );
                })
            )}
            <div style={{ height: '16px' }} />
        </div>
    );
};

export default DeviceList;
