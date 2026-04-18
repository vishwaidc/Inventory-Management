import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://inventory-management-xbb6.onrender.com/api' : 'http://localhost:5000/api');

const Inventory = () => {
    const { token, isAdmin } = useAuth();
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form State
    const [newPart, setNewPart] = useState({ part_name: '', part_number: '', quantity: 0, threshold: 5 });

    const fetchParts = () => {
        setLoading(true);
        axios.get(`${API}/parts`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => setParts(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchParts();
    }, [token]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/parts`, newPart, { headers: { Authorization: `Bearer ${token}` } });
            setIsAdding(false);
            setNewPart({ part_name: '', part_number: '', quantity: 0, threshold: 5 });
            fetchParts();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to create part');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Permanently delete this part from inventory?')) return;
        try {
            await axios.delete(`${API}/parts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchParts();
        } catch (error) {
            alert('Deletion failed');
        }
    };
    
    const updateQuantity = async (part, delta) => {
        try {
            const updated = { ...part, quantity: Math.max(0, part.quantity + delta) };
            await axios.put(`${API}/parts/${part.id}`, updated, { headers: { Authorization: `Bearer ${token}` } });
            fetchParts();
        } catch (error) {
            alert('Failed to update stock');
        }
    };

    if (loading) return <div className="state-center"><div className="state-icon">⏳</div><p>Loading Inventory...</p></div>;

    return (
        <div className="page" style={{ paddingBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>📦 Spare Parts</h2>
                {isAdmin && (
                    <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(!isAdding)}>
                        {isAdding ? 'Cancel' : '➕ Add Part'}
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="card" style={{ marginBottom: '16px', background: 'var(--bg)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Register New Part</h3>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input className="input" placeholder="Part Name (e.g. Oxygen Sensor)" value={newPart.part_name} onChange={e => setNewPart({ ...newPart, part_name: e.target.value })} required />
                        <input className="input" placeholder="Stock Keeping Unit / Serial Number" value={newPart.part_number} onChange={e => setNewPart({ ...newPart, part_number: e.target.value })} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Initial Stock
                                <input type="number" className="input" value={newPart.quantity} onChange={e => setNewPart({ ...newPart, quantity: parseInt(e.target.value) })} required />
                            </label>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Low Threshold
                                <input type="number" className="input" value={newPart.threshold} onChange={e => setNewPart({ ...newPart, threshold: parseInt(e.target.value) })} required />
                            </label>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '4px' }}>Save Inventory Item</button>
                    </form>
                </div>
            )}

            {parts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Inventory ledger is completely empty.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {parts.map(part => {
                        const isLow = part.quantity <= part.threshold;
                        return (
                            <div key={part.id} className="card" style={isLow ? { borderLeft: '4px solid var(--danger)' } : { borderLeft: '4px solid var(--success)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ paddingRight: '12px' }}>
                                        <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{part.part_name}</h3>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>PN: {part.part_number || 'N/A'}</p>
                                        {isLow && <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 'bold' }}>⚠️ Low Stock</span>}
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: isLow ? 'var(--danger)' : 'var(--text)' }}>
                                            {part.quantity}
                                        </div>
                                        {isAdmin && (
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button onClick={() => updateQuantity(part, -1)} style={{ width: '30px', height: '30px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>-</button>
                                                <button onClick={() => updateQuantity(part, 1)} style={{ width: '30px', height: '30px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--primary)', color: 'white', cursor: 'pointer' }}>+</button>
                                            </div>
                                        )}
                                        {isAdmin && (
                                            <button onClick={() => handleDelete(part.id)} style={{ fontSize: '0.7rem', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', marginTop: '4px', padding: 0 }}>
                                                🗑 Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Inventory;
