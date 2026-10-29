import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'applicant' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <section className="auth-card">
      <p className="eyebrow">Welcome to CareerNest</p>
      <h1>{isLogin ? 'Good to see you again.' : 'Start your next chapter.'}</h1>

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

        <button className="button" type="submit" disabled={loading}>
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

