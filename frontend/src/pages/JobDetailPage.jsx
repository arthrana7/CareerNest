import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import CompanyLogo from '../components/CompanyLogo';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

export default function JobDetailPage({ defaultApplyOpen = false }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user, switchAccount } = useAuth();
  const navigate = useNavigate();
  const resumeRef = useRef(null);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Apply state - opens automatically if query param ?apply=true or prop defaultApplyOpen
  const [hasApplied, setHasApplied] = useState(false);
  const [showForm, setShowForm] = useState(defaultApplyOpen || searchParams.get('apply') === 'true');
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('apply') === 'true') {
      setShowForm(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const { data } = await client.get(`/jobs/${id}`);
        setJob(data.job);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();

    // Check if applicant has already applied
    if (user?.role === 'applicant') {
      client.get('/applications').then(({ data }) => {
        const applied = (data.applications || []).some(a => (a.job?._id || a.job) === id);
        setHasApplied(applied);
      }).catch(() => {});
    }
  }, [id, user]);

  const handleApplyClick = () => {
    setShowForm(true);
    setApplyError('');
  };

  const handleSwitchToApplicant = async () => {
    try {
      const { data } = await client.get('/auth/accounts');
      if (data.applicants?.length > 0) {
        await switchAccount({ email: data.applicants[0].email });
        setApplyError('');
      } else {
        navigate('/register');
      }
    } catch {
      navigate('/login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setApplyError('Please sign in or select an account below to submit.');
      return;
    }
    if (user.role !== 'applicant') {
      setApplyError('You are currently on a recruiter account. Please switch to an applicant account to submit.');
      return;
    }
    setApplyError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('jobId', id);
      if (coverLetter.trim()) fd.append('coverLetter', coverLetter.trim());
      if (resume) fd.append('resume', resume);
      await client.post('/applications', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setApplySuccess(true);
      setHasApplied(true);
    } catch (err) {
      setApplyError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <section className="job-detail-loading">
      <div className="spinner" />
      <p className="muted">Loading job details…</p>
    </section>
  );

  if (notFound) return (
    <section style={{ padding: '60px 0', textAlign: 'center' }}>
      <p className="eyebrow">Not found</p>
      <h1 style={{ fontSize: '36px' }}>This job no longer exists.</h1>
      <Link to="/jobs" className="button" style={{ marginTop: '24px', display: 'inline-block' }}>← Back to jobs</Link>
    </section>
  );

  const salary = (() => {
    const s = job.salary;
    if (!s?.min && !s?.max) return null;
    const fmt = n => n >= 100000 ? `${(n / 100000).toFixed(1)}L` : `${(n / 1000).toFixed(0)}K`;
    if (s.min && s.max) return `₹${fmt(s.min)} – ₹${fmt(s.max)}`;
    if (s.min) return `From ₹${fmt(s.min)}`;
    return `Up to ₹${fmt(s.max)}`;
  })();

  return (
    <div className="job-detail-layout">
      {/* ── LEFT COLUMN ── */}
      <div className="job-detail-main">
        <Link to="/jobs" className="back-link">← All jobs</Link>

        <div className="job-detail-header">
          <CompanyLogo name={job.companyName} url={job.companyLogo} className="" />
          <div className="job-detail-header-text">
            <span className="pill">{job.employmentType?.toUpperCase()}</span>
            <h1 className="job-detail-title">{job.title}</h1>
            <p className="job-detail-meta">
              {job.companyName} · {job.location} · Posted {timeAgo(job.createdAt)}
            </p>
          </div>
        </div>

        {salary && (
          <div className="job-detail-salary">
            <span className="salary-badge large">{salary}</span>
          </div>
        )}

        <hr className="divider" />

        <section className="job-detail-section">
          <h2>About the role</h2>
          <p className="job-detail-description">{job.description}</p>
          {job.skills?.length > 0 && (
            <div className="skill-tags" style={{ marginTop: '18px' }}>
              {job.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
            </div>
          )}
        </section>

        <hr className="divider" />

        <section className="job-detail-section">
          <h2>About {job.companyName}</h2>
          <p className="job-detail-description">
            {job.companyAbout || 'Company information will be shared by the recruiter soon.'}
          </p>
        </section>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <aside className="job-detail-sidebar">
        <div className="apply-card">
          <p className="eyebrow">Interested?</p>
          <h2 className="apply-card-title">Make your move.</h2>
          <p className="muted apply-card-desc">
            Apply directly and keep track of your application from your workspace.
          </p>

          {hasApplied && !showForm ? (
            <div className="apply-card-applied">
              <span>✓ Application submitted</span>
              <p className="muted" style={{ margin: '8px 0 12px', fontSize: '13px' }}>
                You have already submitted an application for this role.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to="/dashboard" className="button secondary" style={{ textAlign: 'center' }}>
                  View in dashboard
                </Link>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setShowForm(true)}
                  style={{ textAlign: 'center', fontSize: '13px', textDecoration: 'underline' }}
                >
                  Submit another application / re-upload résumé →
                </button>
              </div>
            </div>
          ) : applySuccess ? (
            <div className="form-success" style={{ marginTop: '16px' }}>
              🎉 Application submitted! <Link to="/dashboard" style={{ color: '#1d6b3e' }}>View in dashboard →</Link>
            </div>
          ) : !showForm ? (
            <button className="button apply-cta-btn" onClick={handleApplyClick}>
              Apply now
            </button>
          ) : (
            <>
              <button className="button apply-cta-btn" onClick={handleApplyClick} disabled>
                Apply now
              </button>
              <hr className="divider" style={{ margin: '20px 0' }} />
              <form onSubmit={handleSubmit} className="apply-form">
                {applyError && <p className="form-error">{applyError}</p>}

                {user?.role === 'recruiter' && (
                  <div style={{ background: '#fff9e6', border: '1px solid #ebd69b', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', color: '#7a5a12', marginBottom: '14px' }}>
                    <strong>Note:</strong> You're logged in as Recruiter (<code>{user.email}</code>). Applications must be submitted by an applicant.
                    <button
                      type="button"
                      className="button small"
                      onClick={handleSwitchToApplicant}
                      style={{ marginTop: '8px', width: '100%', fontSize: '12px' }}
                    >
                      ⇄ 1-Click Switch to Applicant & Apply
                    </button>
                  </div>
                )}

                {!user && (
                  <div style={{ background: '#edf2ee', border: '1px solid #c8d9cc', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', color: '#234b39', marginBottom: '14px' }}>
                    Please <Link to="/login" style={{ fontWeight: 600, color: '#234b39' }}>sign in</Link> or <Link to="/register" style={{ fontWeight: 600, color: '#234b39' }}>register</Link> to submit your application.
                  </div>
                )}

                <label>
                  Cover letter <span className="optional">optional</span>
                  <textarea
                    value={coverLetter}
                    onChange={e => setCoverLetter(e.target.value)}
                    rows={4}
                    placeholder="Why are you a great fit?"
                  />
                </label>

                <label style={{ marginTop: '14px' }}>
                  Résumé <span className="optional">PDF, DOC, or DOCX · 5 MB max</span>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      ref={resumeRef}
                      onChange={e => setResume(e.target.files[0] || null)}
                    />
                    {resume && <p className="file-chosen">{resume.name}</p>}
                  </div>
                </label>

                <button className="button publish-btn" type="submit" disabled={submitting} style={{ marginTop: '14px' }}>
                  {submitting ? 'Submitting…' : 'Submit application'}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  style={{ width: '100%', marginTop: '8px' }}
                  onClick={() => { setShowForm(false); setApplyError(''); }}
                >
                  Cancel
                </button>
              </form>
            </>
          )}

          {!user && !showForm && (
            <p className="muted" style={{ marginTop: '14px', fontSize: '13px', textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#234b39' }}>Sign in</Link> to apply
            </p>
          )}
          {user?.role === 'recruiter' && !showForm && (
            <p className="muted" style={{ marginTop: '14px', fontSize: '13px', textAlign: 'center' }}>
              You're viewing as a recruiter.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
