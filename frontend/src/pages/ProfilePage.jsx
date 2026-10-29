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
          {/* Avatar preview */}
          <div className="profile-avatar-row">
            <div className="profile-avatar" onClick={() => avatarRef.current?.click()}>
              {avatarSrc
                ? <img src={avatarSrc} alt="Avatar" className="profile-avatar-img" />
                : <span className="profile-avatar-initials">{initials}</span>
              }
              <div className="profile-avatar-overlay">Change</div>
            </div>
            <input
              type="file"
              ref={avatarRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, margin: '0 0 4px', color: '#1f3528' }}>{user?.name}</p>
              <p className="muted" style={{ margin: 0, fontSize: '13px' }}>Click the avatar to change photo</p>
            </div>
          </div>

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
              value={user?.email}
              readOnly
              style={{ background: '#f0ede6', cursor: 'not-allowed', color: '#8a9489' }}
              title="Email cannot be changed"
            />
          </label>

          <label>
            Role
            <input
              type="text"
              value={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              readOnly
              style={{ background: '#f0ede6', cursor: 'not-allowed', color: '#8a9489' }}
            />
          </label>

          {avatarFile && (
            <label style={{ marginTop: '4px' }}>
              Profile image <span className="optional">selected</span>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>{avatarFile.name}</p>
            </label>
          )}

          <button className="button publish-btn" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </section>
  );
}
