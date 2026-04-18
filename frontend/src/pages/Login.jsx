import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://inventory-management-xbb6.onrender.com/api' : 'http://localhost:5000/api');

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [isAdmin, setIsAdmin] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${API_URL}/auth/login`, { email, password });
            const { token, user } = res.data;

            // Admin mode: enforce admin role
            if (isAdmin && user.role !== 'admin') {
                setError('This account does not have admin access.');
                setLoading(false);
                return;
            }

            // Regular login: block admin accounts from using the main login
            if (!isAdmin && user.role === 'admin') {
                setError('Admin accounts must use the Admin Login below.');
                setLoading(false);
                return;
            }

            login(token, user);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* Branding */}
                <div style={styles.brand}>
                    <div style={styles.brandIcon}>{isAdmin ? '🛡️' : '⚕'}</div>
                    <h1 style={styles.brandTitle}>MedEquip Track</h1>
                    <p style={styles.brandSub}>
                        {isAdmin ? 'Admin Portal — Restricted Access' : 'Staff Login · Mechanic & Admin'}
                    </p>
                </div>

                {/* Admin mode banner */}
                {isAdmin && (
                    <div style={styles.adminBanner}>
                        🛡️ You are signing in as <strong>Administrator</strong>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    {error && <div style={styles.errorBox}>{error}</div>}

                    <div style={styles.field}>
                        <label style={styles.label}>Email Address</label>
                        <input
                            id="login-email"
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
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={styles.input}
                        />
                    </div>

                    <button
                        id="login-submit"
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.submitBtn,
                            opacity: loading ? 0.7 : 1,
                            background: isAdmin
                                ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                                : 'linear-gradient(135deg,#667eea,#764ba2)',
                        }}
                    >
                {loading ? 'Signing in...' : isAdmin ? '🛡️ Sign in as Admin' : '🔧 Sign in as Mechanic / Admin'}
                    </button>
                </form>

                {/* Footer */}
                <p style={styles.footer}>
                    Don't have an account?{' '}
                    <Link to="/signup" style={styles.link}>Sign up</Link>
                </p>

                {/* Divider */}
                <div style={styles.divider}>
                    <span style={styles.dividerText}>or</span>
                </div>

                {/* Admin toggle */}
                <button
                    type="button"
                    onClick={() => { setIsAdmin(a => !a); setError(''); setEmail(''); setPassword(''); }}
                    style={styles.adminToggle}
                >
                    {isAdmin ? '← Back to regular login' : '🛡️ Admin Login'}
                </button>
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
    adminBanner: {
        background: '#f5f3ff',
        border: '1px solid #c4b5fd',
        color: '#5b21b6',
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '0.85rem',
        textAlign: 'center',
        marginBottom: '18px',
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
        transition: 'border-color 0.2s',
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
        marginTop: '18px',
        fontSize: '0.9rem',
        color: '#64748b',
    },
    link: {
        color: '#7c3aed',
        fontWeight: '600',
        textDecoration: 'none',
    },
    divider: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        margin: '16px 0 12px',
    },
    dividerText: {
        color: '#94a3b8',
        fontSize: '0.82rem',
        background: 'white',
        padding: '0 8px',
        flex: 1,
        textAlign: 'center',
        borderTop: '1px solid #e2e8f0',
    },
    adminToggle: {
        width: '100%',
        padding: '11px',
        background: 'transparent',
        border: '1.5px solid #e2e8f0',
        borderRadius: '12px',
        color: '#6366f1',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
};

export default Login;
