import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://inventory-management-xbb6.onrender.com/api' : 'http://localhost:5000/api');

const Signup = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [role, setRole] = useState('customer');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Register the user
            await axios.post(`${API_URL}/auth/register`, { name, email, password, role });

            // Auto-login after registration
            const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
            const { token, user } = loginRes.data;
            login(token, user);
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.error || (err.response?.data?.errors ? err.response.data.errors.join(', ') : null) || 'Registration failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* Branding */}
                <div style={styles.brand}>
                    <div style={styles.brandIcon}>⚕</div>
                    <h1 style={styles.brandTitle}>MedEquip Track</h1>
                    <p style={styles.brandSub}>Create your account</p>
                </div>

                {/* Role Toggle */}
                <div style={styles.roleToggle}>
                    <button
                        type="button"
                        style={{ ...styles.roleBtn, ...(role === 'customer' ? styles.roleBtnActive : {}) }}
                        onClick={() => setRole('customer')}
                    >
                        👤 Customer
                    </button>
                    <button
                        type="button"
                        style={{ ...styles.roleBtn, ...(role === 'mechanic' ? styles.roleBtnActive : {}) }}
                        onClick={() => setRole('mechanic')}
                    >
                        🔧 Mechanic
                    </button>
                    <button
                        type="button"
                        style={{ ...styles.roleBtn, ...(role === 'admin' ? styles.roleBtnActive : {}) }}
                        onClick={() => setRole('admin')}
                    >
                        🛡️ Admin
                    </button>
                </div>

                {/* Role Badge */}
                <div style={styles.roleBadge}>
                    Registering as: <strong>{role === 'customer' ? 'Customer' : role === 'mechanic' ? 'Mechanic' : 'Admin'}</strong>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    {error && <div style={styles.errorBox}>{error}</div>}

                    <div style={styles.field}>
                        <label style={styles.label}>Full Name</label>
                        <input
                            id="signup-name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Email Address</label>
                        <input
                            id="signup-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Password</label>
                        <input
                            id="signup-password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            required
                            minLength={6}
                            style={styles.input}
                        />
                    </div>

                    <button
                        id="signup-submit"
                        type="submit"
                        disabled={loading}
                        style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Creating account...' : `Create ${role === 'admin' ? 'Admin' : role === 'mechanic' ? 'Mechanic' : 'Customer'} Account`}
                    </button>
                </form>

                <p style={styles.footer}>
                    Already have an account?{' '}
                    <Link to="/login" style={styles.link}>Sign in</Link>
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
    },
    card: {
        background: 'white',
        borderRadius: '20px',
        padding: '40px 32px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    },
    brand: {
        textAlign: 'center',
        marginBottom: '24px',
    },
    brandIcon: {
        fontSize: '2.5rem',
        marginBottom: '8px',
    },
    brandTitle: {
        margin: '0 0 6px 0',
        fontSize: '1.6rem',
        fontWeight: '700',
        color: '#1e293b',
    },
    brandSub: {
        margin: 0,
        color: '#64748b',
        fontSize: '0.9rem',
    },
    roleToggle: {
        display: 'flex',
        background: '#f1f5f9',
        borderRadius: '12px',
        padding: '4px',
        marginBottom: '12px',
        gap: '4px',
    },
    roleBtn: {
        flex: 1,
        padding: '10px',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '500',
        background: 'transparent',
        color: '#64748b',
        transition: 'all 0.2s',
    },
    roleBtnActive: {
        background: 'white',
        color: '#7c3aed',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        fontWeight: '600',
    },
    roleBadge: {
        textAlign: 'center',
        fontSize: '0.82rem',
        color: '#7c3aed',
        background: '#f5f3ff',
        borderRadius: '8px',
        padding: '8px',
        marginBottom: '20px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    label: {
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#374151',
    },
    input: {
        padding: '12px 14px',
        borderRadius: '10px',
        border: '1.5px solid #e2e8f0',
        fontSize: '1rem',
        outline: 'none',
        color: '#1e293b',
    },
    errorBox: {
        background: '#fee2e2',
        color: '#991b1b',
        padding: '12px 14px',
        borderRadius: '10px',
        fontSize: '0.85rem',
        fontWeight: '500',
    },
    submitBtn: {
        padding: '13px',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '4px',
        transition: 'opacity 0.2s',
    },
    footer: {
        textAlign: 'center',
        marginTop: '20px',
        fontSize: '0.9rem',
        color: '#64748b',
    },
    link: {
        color: '#7c3aed',
        fontWeight: '600',
        textDecoration: 'none',
    },
};

export default Signup;
