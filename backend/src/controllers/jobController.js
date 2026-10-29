import Job from '../models/Job.js';

export async function listJobs(req, res, next) {
  try {
    const { keyword, location, employmentType } = req.query;
    const query = { status: 'open' };
    if (keyword) query.$or = ['title', 'companyName', 'description', 'skills'].map(field => ({ [field]: { $regex: keyword, $options: 'i' } }));
    if (location) query.location = { $regex: location, $options: 'i' };
    if (employmentType) query.employmentType = employmentType;
    const jobs = await Job.find(query).sort({ createdAt: -1 }).populate('recruiter', 'name avatar');
    res.json({ jobs });
  } catch (error) { next(error); }
}

export async function getJobById(req, res, next) {
  try {
    const job = await Job.findById(req.params.id).populate('recruiter', 'name avatar');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ job });
  } catch (error) { next(error); }
}

export async function createJob(req, res, next) {
  try {
    const job = await Job.create({ ...req.body, recruiter: req.user._id });
    res.status(201).json({ job });
  } catch (error) { next(error); }
}

export async function updateJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (req.user.role !== 'admin' && !job.recruiter.equals(req.user._id))
      return res.status(403).json({ message: 'Not your job post' });
    Object.assign(job, req.body);
    await job.save();
    res.json({ job });
  } catch (error) { next(error); }
}

export async function deleteJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (req.user.role !== 'admin' && !job.recruiter.equals(req.user._id))
      return res.status(403).json({ message: 'Not your job post' });
    await job.deleteOne();
    res.status(204).send();
  } catch (error) { next(error); }
}
