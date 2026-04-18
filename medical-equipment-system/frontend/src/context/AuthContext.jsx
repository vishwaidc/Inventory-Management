import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({});

// Decode a JWT payload without a library
const decodeToken = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount, restore session from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('jwt_token');
        const storedUser = localStorage.getItem('jwt_user');
        if (storedToken && storedUser) {
            const decoded = decodeToken(storedToken);
            // Check if token has expired
            if (decoded && decoded.exp * 1000 > Date.now()) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } else {
                // Token expired — clear storage
                localStorage.removeItem('jwt_token');
                localStorage.removeItem('jwt_user');
            }
        }
        setLoading(false);
    }, []);

    const login = (newToken, newUser) => {
        localStorage.setItem('jwt_token', newToken);
        localStorage.setItem('jwt_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('jwt_user');
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        login,
        logout,
        isLoggedIn: !!token,
        isMechanic: user?.role === 'mechanic',
        isCustomer: user?.role === 'customer',
        isAdmin: user?.role === 'admin',
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
