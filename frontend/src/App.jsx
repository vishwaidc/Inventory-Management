import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import CustomerLanding from './pages/CustomerLanding';
import PublicDeviceView from './pages/PublicDeviceView';
import Dashboard from './pages/Dashboard';
import DeviceList from './pages/DeviceList';
import DeviceDetail from './pages/DeviceDetail';
import AddDevice from './pages/AddDevice';
import EditDevice from './pages/EditDevice';
import LogService from './pages/LogService';
import QRScanner from './pages/QRScanner';
import AdminReview from './pages/AdminReview';
import Inventory from './pages/Inventory';

// ─── PROTECTED ROUTE ─────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

// ─── BOTTOM NAV ITEM ─────────────────────────────────────────
const NavItem = ({ to, icon, label }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname === to || location.pathname.startsWith(to + '/');
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={() => navigate(to)}>
      <span className="nav-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

// ─── APP LAYOUT (authenticated staff pages) ───────────────────
const AppLayout = ({ children }) => {
  const { user, logout, isMechanic, isAdmin } = useAuth();
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>⚕ MedEquip Track</h1>
        <div className="header-user">
          <span>{isAdmin ? '🛡️' : isMechanic ? '🔧' : '👤'} {user?.name || user?.email}</span>
          <button className="btn-logout" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="app-content">
        {children}
      </div>

      <nav className="bottom-nav">
        <NavItem to="/dashboard" icon="🏠" label="Home" />
        <NavItem to="/devices" icon="📋" label="Devices" />
        {isMechanic && <NavItem to="/scan" icon="📷" label="Scan" />}
        {isAdmin && <NavItem to="/add-device" icon="➕" label="Add" />}
        {isAdmin && <NavItem to="/admin/review" icon="🛡️" label="Review" />}
        {(isAdmin || isMechanic) && <NavItem to="/inventory" icon="📦" label="Stock" />}
      </nav>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ── Public (no login required) ── */}
          <Route path="/" element={<CustomerLanding />} />
          <Route path="/equipment/:id" element={<PublicDeviceView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ── Protected (staff only) ── */}
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/devices" element={<ProtectedRoute><AppLayout><DeviceList /></AppLayout></ProtectedRoute>} />
          <Route path="/device/:id" element={<ProtectedRoute><AppLayout><DeviceDetail /></AppLayout></ProtectedRoute>} />
          <Route path="/scan" element={<ProtectedRoute><AppLayout><QRScanner /></AppLayout></ProtectedRoute>} />
          <Route path="/add-device" element={<ProtectedRoute><AppLayout><AddDevice /></AppLayout></ProtectedRoute>} />
          <Route path="/edit-device/:id" element={<ProtectedRoute><AppLayout><EditDevice /></AppLayout></ProtectedRoute>} />
          <Route path="/log-service/:id" element={<ProtectedRoute><AppLayout><LogService /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/review" element={<ProtectedRoute><AppLayout><AdminReview /></AppLayout></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><AppLayout><Inventory /></AppLayout></ProtectedRoute>} />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
