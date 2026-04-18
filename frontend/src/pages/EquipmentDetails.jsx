import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const EquipmentDetails = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const [equipment, setEquipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://inventory-management-xbb6.onrender.com/api' : 'http://localhost:5000/api');

    useEffect(() => {
        const fetchEquipmentDetails = async () => {

            try {
                const response = await axios.get(`${API_URL}/equipment/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setEquipment(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching equipment details:", err);
                setError(err.response?.data?.error || "Failed to load equipment data. Make sure you are logged in.");
                setLoading(false);
            }
        };

        fetchEquipmentDetails();
    }, [id, token, API_URL]);

    if (loading) return <div className="page" style={{ padding: '20px' }}>Loading equipment details...</div>;

    if (error) return (
        <div className="page" style={{ padding: '20px', color: 'red' }}>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/scan')} style={{ marginTop: '10px', padding: '10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px' }}>Back to Scanner</button>
        </div>
    );

    if (!equipment) return <div className="page">Equipment not found.</div>;

    return (
        <div className="page" style={{ padding: '20px' }}>
            <h2>{equipment.equipment_name}</h2>
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <p><strong>Model:</strong> {equipment.model_number}</p>
                <p><strong>Serial No:</strong> {equipment.serial_number}</p>
                <p><strong>Manufacturer:</strong> {equipment.manufacturer}</p>
                <p><strong>Department:</strong> {equipment.department}</p>
                <p><strong>Installation Date:</strong> {equipment.installation_date}</p>
            </div>

            <h3>Service History</h3>
            {equipment.service_history && equipment.service_history.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {equipment.service_history.map(service => (
                        <div key={service.id} style={{ background: '#f1f5f9', padding: '10px', borderLeft: '4px solid var(--primary-color)', borderRadius: '4px' }}>
                            <p style={{ margin: '0 0 5px 0' }}><strong>Date:</strong> {service.service_date}</p>
                            <p style={{ margin: '0 0 5px 0' }}><strong>Type:</strong> {service.service_type}</p>
                            <p style={{ margin: '0 0 5px 0' }}><strong>Status:</strong> <span style={{ color: service.status === 'completed' ? 'green' : 'orange' }}>{service.status}</span></p>
                            <p style={{ margin: '0' }}><strong>Technician ID:</strong> {service.technician_id}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No service history found for this equipment.</p>
            )}
        </div>
    );
};

export default EquipmentDetails;
