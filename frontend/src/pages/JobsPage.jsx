import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

function Logo({ name, url }) {
  if (url) return <img src={url} alt={name} className="company-logo-img small" />;
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return <div className="company-logo-initials small">{initials}</div>;
}

export default function JobsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ keyword: '', location: '', employmentType: '' });
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [viewedIds, setViewedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('viewed_jobs') || '[]')); }
    catch { return new Set(); }
  });

  const load = async (params = filters) => {
    setLoading(true);
    try {
      const { data } = await client.get('/jobs', { params });
      setJobs(data.jobs);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (user?.role === 'applicant') {
      client.get('/applications').then(({ data }) => {
        const ids = new Set((data.applications || []).map(a => a.job?._id || a.job));
        setAppliedIds(ids);
      }).catch(() => {});
    }
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    load(filters);
  };

  const handleCardClick = (job) => {
    // Mark as viewed
    const newViewed = new Set([...viewedIds, job._id]);
    setViewedIds(newViewed);
    localStorage.setItem('viewed_jobs', JSON.stringify([...newViewed]));
    navigate(`/jobs/${job._id}`);
  };

  const formatSalary = (salary) => {
    if (!salary?.min && !salary?.max) return null;
    const fmt = n => n >= 100000 ? `${(n / 100000).toFixed(1)}L` : `${(n / 1000).toFixed(0)}K`;
    if (salary.min && salary.max) return `₹${fmt(salary.min)} – ₹${fmt(salary.max)}`;
    if (salary.min) return `From ₹${fmt(salary.min)}`;
    return `Up to ₹${fmt(salary.max)}`;
  };

  return (
    <section>
      <div className="page-heading">
        <p className="eyebrow">Open roles</p>
        <h1>Find your next opportunity</h1>
      </div>

      {/* ── Filters ── */}
      <form className="filters" onSubmit={handleSearch}>
        <input
          placeholder="Title, skill, or company"
          value={filters.keyword}
          onChange={e => setFilters({ ...filters, keyword: e.target.value })}
        />
        <input
          placeholder="Location"
          value={filters.location}
          onChange={e => setFilters({ ...filters, location: e.target.value })}
        />
        <select
          value={filters.employmentType}
          onChange={e => setFilters({ ...filters, employmentType: e.target.value })}
        >
          <option value="">Any type</option>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Contract</option>
          <option>Internship</option>
        </select>
        <button className="button" type="submit">Search</button>
      </form>

      {/* ── Job List ── */}
      {loading ? (
        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
          {[1, 2, 3].map(i => <div key={i} className="job-list-skeleton" />)}
        </div>
      ) : jobs.length === 0 ? (
        <p className="muted" style={{ marginTop: '32px' }}>No roles match those filters yet.</p>
      ) : (
        <div className="jobs-list-view">
          {jobs.map(job => {
            const salary = formatSalary(job.salary);
            const viewed = viewedIds.has(job._id);
            const applied = appliedIds.has(job._id);
            return (
              <article
                key={job._id}
                className="job-list-card"
                onClick={() => handleCardClick(job)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleCardClick(job)}
              >
                <Logo name={job.companyName} url={job.companyLogo} />
                <div className="job-list-card-body">
                  <div className="job-list-card-top">
                    <h2 className="job-list-card-title">
                      {job.title}
                      {viewed && !applied && <span className="badge viewed-badge">Viewed</span>}
                      {applied && <span className="badge applied-badge">Applied</span>}
                    </h2>
                  </div>
                  <p className="job-list-card-meta">{job.companyName} · {job.location}</p>
                  <p className="job-list-card-sub muted">{timeAgo(job.createdAt)} · {job.employmentType}{salary ? ` · ${salary}` : ''}</p>
                  {job.skills?.length > 0 && (
                    <div className="skill-tags" style={{ marginTop: '8px' }}>
                      {job.skills.slice(0, 4).map(s => <span key={s} className="skill-tag">{s}</span>)}
                      {job.skills.length > 4 && <span className="skill-tag muted">+{job.skills.length - 4}</span>}
                    </div>
                  )}
                </div>
                <div className="job-list-card-arrow">→</div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
