import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AccountSwitcherModal({ isOpen, onClose }) {
  const { user, switchAccount, login } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('recruiters'); // 'recruiters' | 'applicants' | 'custom'
  const [accounts, setAccounts] = useState({ recruiters: [], applicants: [], all: [] });
  const [loading, setLoading] = useState(false);
  const [switchingEmail, setSwitchingEmail] = useState('');
  const [error, setError] = useState('');

  // Custom login state
  const [customEmail, setCustomEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [customLoading, setCustomLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setLoading(true);
    client
      .get('/auth/accounts')
      .then(({ data }) => setAccounts(data))
      .catch(() => setError('Could not load accounts list.'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectAccount = async (targetEmail) => {
    if (user?.email === targetEmail) {
      onClose();
      return;
    }
    setError('');
    setSwitchingEmail(targetEmail);
    try {
      await switchAccount({ email: targetEmail });
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to switch account.');
    } finally {
      setSwitchingEmail('');
    }
  };

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCustomLoading(true);
    try {
      await login({ email: customEmail, password: customPassword });
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect email or password.');
    } finally {
      setCustomLoading(false);
    }
  };

  const recruiters = accounts.recruiters || [];
  const applicants = accounts.applicants || [];

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="account-switcher-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>CareerNest Accounts</p>
            <h2 style={{ margin: '4px 0 0', fontSize: '22px' }}>Switch Account / Role</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {user && (
          <div className="current-account-banner">
            <span className="status-dot online" />
            <span>
              Currently active: <strong>{user.name}</strong> ({user.email}) · <span className="pill" style={{ padding: '2px 8px', fontSize: '11px' }}>{user.role}</span>
            </span>
          </div>
        )}

        {error && <p className="form-error" style={{ margin: '12px 0' }}>{error}</p>}

        {/* Tab switcher */}
        <div className="switcher-tabs">
          <button
            className={`switcher-tab ${activeTab === 'recruiters' ? 'active' : ''}`}
            onClick={() => setActiveTab('recruiters')}
          >
            🏢 Recruiters ({recruiters.length})
          </button>
          <button
            className={`switcher-tab ${activeTab === 'applicants' ? 'active' : ''}`}
            onClick={() => setActiveTab('applicants')}
          >
            👤 Applicants ({applicants.length})
          </button>
          <button
            className={`switcher-tab ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            🔑 Other Email
          </button>
        </div>

        {/* Tab contents */}
        <div className="switcher-body">
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#687266' }}>
              Loading accounts…
            </div>
          ) : activeTab === 'recruiters' ? (
            <div className="accounts-list">
              {recruiters.length === 0 ? (
                <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>
                  No recruiter accounts found.
                </p>
              ) : (
                recruiters.map(acc => {
                  const isCurrent = user?.email === acc.email;
                  const isSwitching = switchingEmail === acc.email;
                  return (
                    <div
                      key={acc.id}
                      className={`account-card ${isCurrent ? 'current' : ''}`}
                      onClick={() => !isCurrent && handleSelectAccount(acc.email)}
                    >
                      <div className="account-card-left">
                        <div className="account-avatar">
                          {acc.name?.[0]?.toUpperCase() || 'R'}
                        </div>
                        <div>
                          <p className="account-name">
                            {acc.name}
                            {isCurrent && <span className="badge viewed-badge" style={{ marginLeft: '8px' }}>Active</span>}
                          </p>
                          <p className="account-email">{acc.email}</p>
                        </div>
                      </div>
                      <button
                        className={`button small ${isCurrent ? 'secondary' : ''}`}
                        disabled={isCurrent || !!switchingEmail}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAccount(acc.email);
                        }}
                      >
                        {isSwitching ? 'Switching…' : isCurrent ? 'Active' : 'Switch →'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ) : activeTab === 'applicants' ? (
            <div className="accounts-list">
              {applicants.length === 0 ? (
                <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>
                  No applicant accounts found.
                </p>
              ) : (
                applicants.map(acc => {
                  const isCurrent = user?.email === acc.email;
                  const isSwitching = switchingEmail === acc.email;
                  return (
                    <div
                      key={acc.id}
                      className={`account-card ${isCurrent ? 'current' : ''}`}
                      onClick={() => !isCurrent && handleSelectAccount(acc.email)}
                    >
                      <div className="account-card-left">
                        <div className="account-avatar applicant">
                          {acc.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div>
                          <p className="account-name">
                            {acc.name}
                            {isCurrent && <span className="badge viewed-badge" style={{ marginLeft: '8px' }}>Active</span>}
                          </p>
                          <p className="account-email">{acc.email}</p>
                        </div>
                      </div>
                      <button
                        className={`button small ${isCurrent ? 'secondary' : ''}`}
                        disabled={isCurrent || !!switchingEmail}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAccount(acc.email);
                        }}
                      >
                        {isSwitching ? 'Switching…' : isCurrent ? 'Active' : 'Switch →'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <form onSubmit={handleCustomLogin} className="custom-login-form">
              <label>
                Email
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={customEmail}
                  onChange={e => setCustomEmail(e.target.value)}
                />
              </label>
              <label style={{ marginTop: '10px' }}>
                Password
                <input
                  type="password"
                  required
                  placeholder="Account password"
                  value={customPassword}
                  onChange={e => setCustomPassword(e.target.value)}
                />
              </label>
              <button
                className="button"
                type="submit"
                disabled={customLoading}
                style={{ marginTop: '16px', width: '100%' }}
              >
                {customLoading ? 'Signing in…' : 'Sign in with this account'}
              </button>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <span className="muted" style={{ fontSize: '13px' }}>Want a brand new account?</span>
          <button
            className="link-button"
            style={{ fontWeight: 600, color: '#234b39' }}
            onClick={() => {
              onClose();
              navigate('/register');
            }}
          >
            + Register New Account
          </button>
        </div>
      </div>
    </div>
  );
}
