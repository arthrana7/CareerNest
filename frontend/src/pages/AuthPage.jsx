import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  const { login, switchAccount } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'applicant' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState({ recruiters: [], applicants: [] });
  const [quickLoading, setQuickLoading] = useState('');

  useEffect(() => {
    if (isLogin) {
      client.get('/auth/accounts')
        .then(({ data }) => setAccounts(data))
        .catch(() => {});
    }
  }, [isLogin]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form);
      } else {
        await client.post('/auth/register', form);
        await login(form);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (email) => {
    setError('');
    setQuickLoading(email);
    try {
      await switchAccount({ email });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Quick login failed.');
    } finally {
      setQuickLoading('');
    }
  };

  return (
    <section className="auth-card">
      <p className="eyebrow">Welcome to CareerNest</p>
      <h1>{isLogin ? 'Good to see you again.' : 'Start your next chapter.'}</h1>

      {isLogin && (accounts.recruiters?.length > 0 || accounts.applicants?.length > 0) && (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#faf9f5', borderRadius: '12px', border: '1px solid #e6e3d8' }}>
          <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#566052' }}>
            ⚡ 1-Click Demo Login
          </p>

          {accounts.recruiters?.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#687266', display: 'block', marginBottom: '4px' }}>🏢 Recruiters:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {accounts.recruiters.map(acc => (
                  <button
                    key={acc.id}
                    type="button"
                    className="button small secondary"
                    disabled={!!quickLoading}
                    onClick={() => handleQuickLogin(acc.email)}
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                  >
                    {quickLoading === acc.email ? '…' : `${acc.name} (${acc.email.split('@')[0]})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {accounts.applicants?.length > 0 && (
            <div>
              <span style={{ fontSize: '12px', color: '#687266', display: 'block', marginBottom: '4px' }}>👤 Applicants:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {accounts.applicants.map(acc => (
                  <button
                    key={acc.id}
                    type="button"
                    className="button small secondary"
                    disabled={!!quickLoading}
                    onClick={() => handleQuickLogin(acc.email)}
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                  >
                    {quickLoading === acc.email ? '…' : `${acc.name} (${acc.email.split('@')[0]})`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </label>

        {!isLogin && (
          <>
            <label>
              Full name
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
              />
            </label>

            <label>
              I am joining as
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="applicant">👤 Applicant — looking for a job</option>
                <option value="recruiter">🏢 Recruiter — hiring talent</option>
              </select>
            </label>
          </>
        )}

        <label>
          Password
          <input
            type="password"
            minLength="8"
            required
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="Min. 8 characters"
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="button" type="submit" disabled={loading || !!quickLoading}>
          {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p style={{ marginTop: '18px' }}>
        {isLogin ? 'New here?' : 'Already have an account?'}{' '}
        <Link to={isLogin ? '/register' : '/login'}>
          {isLogin ? 'Create an account' : 'Sign in'}
        </Link>
      </p>
    </section>
  );
}

