import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const avatarRef = useRef(null);

  const [name, setName] = useState(user?.name || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      if (avatarFile) fd.append('avatar', avatarFile);
      const { data } = await client.patch('/auth/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Update auth context with fresh user
      setSuccess('Profile saved successfully!');
      setAvatarFile(null);
      setTimeout(() => setSuccess(''), 4000);
      // Refresh user in context by re-fetching
      window.dispatchEvent(new Event('profile-updated'));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarSrc = avatarPreview || user?.avatar?.url;

  return (
    <section className="profile-page">
      <p className="eyebrow">Your account</p>
      <h1>Profile</h1>
      <p className="lead" style={{ marginBottom: '40px' }}>
        Keep your details current to get the most from CareerNest.
      </p>

      <div className="panel profile-panel">
        <h2 className="panel-title">Personal details</h2>

        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <form onSubmit={handleSubmit} className="profile-form">
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Your full name"
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              style={{ background: '#faf9f6', cursor: 'not-allowed', color: '#687266' }}
              title="Email cannot be changed"
            />
          </label>

          <label>
            Profile image <span className="optional" style={{ fontWeight: 'normal', color: '#687266' }}>optional · max 2 MB</span>
            <div style={{ marginTop: '6px' }}>
              <input
                type="file"
                ref={avatarRef}
                accept="image/*"
                onChange={handleAvatarChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#ffffff',
                  border: '1px solid #d4d1c7',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {(avatarPreview || user?.avatar?.url) && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={avatarPreview || user?.avatar?.url}
                  alt="Avatar preview"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #c9c5b9' }}
                />
                <span style={{ fontSize: '12px', color: '#566052' }}>
                  {avatarPreview ? 'New photo selected' : 'Current photo'}
                </span>
              </div>
            )}
          </label>

          <button className="button publish-btn" type="submit" disabled={saving} style={{ marginTop: '8px' }}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </section>
  );
}
