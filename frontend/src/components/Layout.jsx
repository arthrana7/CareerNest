import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountSwitcherModal from './AccountSwitcherModal';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSwitcher, setShowSwitcher] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header>
        <Link className="brand" to="/">CareerNest</Link>
        <nav>
          <NavLink to="/jobs">Find jobs</NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/profile">Profile</NavLink>
              <button
                className="link-button role-switcher-trigger"
                onClick={() => setShowSwitcher(true)}
                title="Switch between recruiter or applicant accounts"
              >
                ⇄ Switch Account ({user.role})
              </button>
              <button className="link-button" onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <>
              <button
                className="link-button role-switcher-trigger"
                onClick={() => setShowSwitcher(true)}
                title="Quickly choose or switch accounts"
              >
                ⇄ Switch Account
              </button>
              <NavLink to="/login">Sign in</NavLink>
              <Link className="button small" to="/register">Get started</Link>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>

      <AccountSwitcherModal
        isOpen={showSwitcher}
        onClose={() => setShowSwitcher(false)}
      />
    </>
  );
}
