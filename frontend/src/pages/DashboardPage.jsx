import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

const EMPTY_FORM = {
  title: "", companyName: "", companyLogo: "", description: "",
  location: "", employmentType: "Full-time", skills: "",
  salaryMin: "", salaryMax: "", roleDescription: "",
};

const STATUS_OPTIONS = ["submitted", "reviewing", "shortlisted", "rejected", "hired"];
const STATUS_LABELS = { submitted: "Submitted", reviewing: "Reviewing", shortlisted: "Shortlisted", rejected: "Rejected", hired: "Hired 🎉" };

function buildPayload(form) {
  return {
    title: form.title.trim(),
    companyName: form.companyName.trim(),
    ...(form.companyLogo.trim() && { companyLogo: form.companyLogo.trim() }),
    description: (form.roleDescription.trim() || form.description.trim()) || "See role details.",
    companyAbout: form.description.trim() || undefined,
    location: form.location.trim(),
    employmentType: form.employmentType,
    skills: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
    salary: {
      min: form.salaryMin ? Number(form.salaryMin) : undefined,
      max: form.salaryMax ? Number(form.salaryMax) : undefined,
      currency: "INR",
    },
  };
}

function jobToForm(job) {
  return {
    title: job.title || "",
    companyName: job.companyName || "",
    companyLogo: job.companyLogo || "",
    description: job.companyAbout || "",
    location: job.location || "",
    employmentType: job.employmentType || "Full-time",
    skills: (job.skills || []).join(", "),
    salaryMin: job.salary?.min?.toString() || "",
    salaryMax: job.salary?.max?.toString() || "",
    roleDescription: job.description || "",
  };
}

/* ─── Recruiter Dashboard ──────────────────────────────── */
function RecruiterDashboard({ user }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingJob, setEditingJob] = useState(null); // job being edited
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null); // application id being updated

  // Fetch recruiter's jobs
  useEffect(() => {
    client.get("/jobs")
      .then(({ data }) => {
        const uid = user.id || user._id;
        setJobs(data.jobs.filter(j => j.recruiter?._id === uid || j.recruiter === uid));
      })
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  }, [user.id, user._id]);

  // Fetch applications when a job is selected
  useEffect(() => {
    if (!selectedJob) return;
    client.get("/applications")
      .then(({ data }) => {
        const filtered = (data.applications || []).filter(
          a => (a.job?._id || a.job) === selectedJob._id
        );
        setApplications(filtered);
      })
      .catch(() => setApplications([]));
  }, [selectedJob]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const startEdit = (job) => {
    setEditingJob(job);
    setForm(jobToForm(job));
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingJob(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.title.trim() || !form.companyName.trim() || !form.location.trim()) {
      setError("Job title, company name, and location are required.");
      return;
    }
    const payload = buildPayload(form);
    try {
      setSubmitting(true);
      if (editingJob) {
        const { data } = await client.patch(`/jobs/${editingJob._id}`, payload);
        setJobs(prev => prev.map(j => j._id === editingJob._id ? data.job : j));
        if (selectedJob?._id === editingJob._id) setSelectedJob(data.job);
        setEditingJob(null);
        setSuccess("Job updated successfully!");
      } else {
        const { data } = await client.post("/jobs", payload);
        setJobs(prev => [data.job, ...prev]);
        setSuccess("Job published successfully!");
      }
      setForm(EMPTY_FORM);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm("Delete this job post? This cannot be undone.")) return;
    try {
      await client.delete(`/jobs/${jobId}`);
      setJobs(prev => prev.filter(j => j._id !== jobId));
      if (selectedJob?._id === jobId) setSelectedJob(null);
    } catch {
      alert("Could not delete. Try again.");
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingStatus(appId);
    try {
      const { data } = await client.patch(`/applications/${appId}/status`, { status: newStatus });
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, status: data.application.status } : a));
    } catch {
      alert("Failed to update status. Try again.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <section className="dashboard">
      <p className="eyebrow">Recruiter workspace</p>
      <h1>Welcome back, {user.name.split(" ")[0]}.</h1>
      <p className="lead">Manage openings and meet the people behind the applications.</p>

      <div className="recruiter-grid">
        {/* ── LEFT: Post / Edit Job ── */}
        <div className="panel">
          <div className="panel-header-row">
            <div>
              <p className="panel-label">JOB MANAGEMENT</p>
              <h2 className="panel-title">{editingJob ? "Edit job post" : "Post a new role"}</h2>
            </div>
            {editingJob && (
              <button className="link-btn danger" onClick={cancelEdit}>Cancel edit</button>
            )}
          </div>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <form className="job-form" onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <label>
                Job title
                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Frontend Developer" required />
              </label>
              <label>
                Company name
                <input name="companyName" value={form.companyName} onChange={handleChange} placeholder="e.g. Apple" required />
              </label>
            </div>

            <label>
              Company logo URL <span className="optional">optional</span>
              <input name="companyLogo" value={form.companyLogo} onChange={handleChange} placeholder="https://..." />
            </label>

            <label>
              About the company <span className="optional">shown on job detail page</span>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Tell candidates about the company culture, mission..." />
            </label>

            <div className="form-row">
              <label>
                Location
                <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Hyderabad" required />
              </label>
              <label>
                Employment type
                <select name="employmentType" value={form.employmentType} onChange={handleChange}>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </select>
              </label>
            </div>

            <label>
              Skills <span className="optional">comma-separated</span>
              <input name="skills" value={form.skills} onChange={handleChange} placeholder="React, Node.js, MongoDB" />
            </label>

            <div className="form-row">
              <label>
                Minimum salary
                <input name="salaryMin" type="number" value={form.salaryMin} onChange={handleChange} placeholder="e.g. 400000" />
              </label>
              <label>
                Maximum salary
                <input name="salaryMax" type="number" value={form.salaryMax} onChange={handleChange} placeholder="e.g. 800000" />
              </label>
            </div>

            <label>
              Role description
              <textarea name="roleDescription" value={form.roleDescription} onChange={handleChange} rows={4} placeholder="Describe responsibilities, requirements, perks..." />
            </label>

            <button className="button publish-btn" type="submit" disabled={submitting}>
              {submitting ? "Saving…" : editingJob ? "Save changes" : "Publish job"}
            </button>
          </form>
        </div>

        {/* ── RIGHT: Job Submissions ── */}
        <div className="panel">
          <p className="panel-label">APPLICATIONS</p>
          <h2 className="panel-title">Job submissions</h2>

          {loadingJobs ? (
            <p className="muted">Loading your jobs…</p>
          ) : jobs.length === 0 ? (
            <p className="muted">No jobs posted yet. Create your first role →</p>
          ) : (
            <>
              <p className="muted" style={{ marginBottom: "16px" }}>
                {selectedJob
                  ? `Showing applicants for: ${selectedJob.title}`
                  : "Choose a role to see its applicants."}
              </p>

              <div className="job-list">
                {jobs.map(job => (
                  <div key={job._id} className={`job-list-item ${selectedJob?._id === job._id ? "active" : ""}`}>
                    <div className="job-list-info">
                      <strong>{job.title}</strong>
                      <span className="muted">{job.companyName} · {job.location}</span>
                    </div>
                    <div className="job-list-actions">
                      <button className="link-btn" onClick={() => startEdit(job)}>Edit</button>
                      <button className="link-btn" onClick={() => setSelectedJob(selectedJob?._id === job._id ? null : job)}>
                        {selectedJob?._id === job._id ? "Hide" : "Submissions"}
                      </button>
                      <button className="link-btn danger" onClick={() => handleDelete(job._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedJob && (
                <div className="applications-list">
                  <h3 style={{ marginTop: "24px", fontSize: "16px" }}>
                    Applicants for {selectedJob.title}
                  </h3>
                  {applications.length === 0 ? (
                    <p className="muted">No applications received yet.</p>
                  ) : (
                    applications.map(app => (
                      <div key={app._id} className="applicant-card expanded">
                        <div className="applicant-card-info">
                          <strong>{app.applicant?.name || "Applicant"}</strong>
                          <p className="muted" style={{ margin: "2px 0" }}>{app.applicant?.email}</p>
                          {app.coverLetter && (
                            <details className="cover-letter-toggle">
                              <summary>View cover letter</summary>
                              <p className="cover-letter-text">{app.coverLetter}</p>
                            </details>
                          )}
                          {app.resume?.url && (
                            <a href={app.resume.url} target="_blank" rel="noreferrer" className="resume-link">
                              📄 View résumé
                            </a>
                          )}
                        </div>
                        <div className="applicant-card-actions">
                          <select
                            className="status-select"
                            value={app.status}
                            disabled={updatingStatus === app._id}
                            onChange={e => handleStatusChange(app._id, e.target.value)}
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                          <span className={`status-pill status-${app.status}`}>{app.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Applicant Dashboard ──────────────────────────────── */
function ApplicantDashboard({ user }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get("/applications")
      .then(({ data }) => setApplications(data.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalApplied = applications.length;
  const inProgress = applications.filter(a => ['reviewing', 'shortlisted'].includes(a.status)).length;
  const hired = applications.filter(a => a.status === 'hired').length;

  return (
    <section className="dashboard">
      <p className="eyebrow">Applicant workspace</p>
      <h1>Welcome back, {user.name.split(" ")[0]}.</h1>
      <p className="lead">Track applications and keep your profile ready for the next great role.</p>

      {/* Stats strip */}
      <div className="applicant-stats">
        <div className="applicant-stat-card">
          <span className="stat-number">{totalApplied}</span>
          <span className="stat-label">Applied</span>
        </div>
        <div className="applicant-stat-card">
          <span className="stat-number">{inProgress}</span>
          <span className="stat-label">In progress</span>
        </div>
        <div className="applicant-stat-card">
          <span className="stat-number">{hired}</span>
          <span className="stat-label">Hired 🎉</span>
        </div>
      </div>

      <div className="panel" style={{ marginTop: "28px", maxWidth: "760px" }}>
        <p className="panel-label">MY APPLICATIONS</p>
        <h2 className="panel-title">Your submissions</h2>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : applications.length === 0 ? (
          <p className="muted">
            No applications yet.{" "}
            <Link to="/jobs" style={{ color: "#234b39" }}>Browse open roles</Link> and apply.
          </p>
        ) : (
          <div className="applications-list">
            {applications.map(app => (
              <div key={app._id} className="applicant-card">
                <div className="applicant-card-info">
                  <strong>{app.job?.title || "Job"}</strong>
                  <p className="muted" style={{ margin: "2px 0" }}>
                    {app.job?.companyName} · {app.job?.location}
                  </p>
                  <p className="muted" style={{ margin: "2px 0", fontSize: "12px" }}>
                    Applied {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {app.job?.salary?.min && ` · ₹${(app.job.salary.min / 100000).toFixed(1)}L – ₹${(app.job.salary.max / 100000).toFixed(1)}L`}
                  </p>
                  {app.job?._id && (
                    <Link to={`/jobs/${app.job._id}`} className="link-btn" style={{ fontSize: '13px', marginTop: '4px', display: 'inline-block' }}>
                      View job →
                    </Link>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span className={`status-pill status-${app.status}`}>{app.status}</span>
                  {app.status === 'hired' && <span style={{ fontSize: '20px' }}>🎉</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Admin Dashboard ──────────────────────────────────── */
function AdminDashboard({ user }) {
  return (
    <section className="dashboard">
      <p className="eyebrow">Admin workspace</p>
      <h1>Welcome back, {user.name.split(" ")[0]}.</h1>
      <p className="lead">Oversee portal activity and manage access across your organization.</p>
    </section>
  );
}

/* ─── Main Export ──────────────────────────────────────── */
export default function DashboardPage() {
  const { user, switchRole } = useAuth();
  const [switching, setSwitching] = useState(false);

  const handleSwitchRole = async () => {
    const newRole = user.role === 'recruiter' ? 'applicant' : 'recruiter';
    if (!window.confirm(`Switch your account role to "${newRole}"? This will change what you can do on CareerNest.`)) return;
    setSwitching(true);
    try {
      await switchRole(newRole);
    } catch {
      alert('Failed to switch role. Try again.');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div>
      {/* Role badge + switcher strip */}
      <div className="role-strip">
        <span className="role-badge">
          {user.role === 'recruiter' ? '🏢' : '👤'} Logged in as <strong>{user.role}</strong>
        </span>
        {user.role !== 'admin' && (
          <button className="link-btn role-switch-btn" onClick={handleSwitchRole} disabled={switching}>
            {switching ? 'Switching…' : `Switch to ${user.role === 'recruiter' ? 'Applicant' : 'Recruiter'}`}
          </button>
        )}
      </div>

      {user.role === 'recruiter' && <RecruiterDashboard user={user} />}
      {user.role === 'applicant' && <ApplicantDashboard user={user} />}
      {user.role === 'admin' && <AdminDashboard user={user} />}
    </div>
  );
}
