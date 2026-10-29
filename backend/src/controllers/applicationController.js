import Application from '../models/Application.js';
import Job from '../models/Job.js';
import uploadToCloudinary from '../utils/uploadToCloudinary.js';

export async function createApplication(req, res, next) {
  try {
    const job = await Job.findOne({ _id: req.body.jobId, status: 'open' });
    if (!job) return res.status(404).json({ message: 'Open job not found' });

    let resume;
    if (req.file) {
      const file = await uploadToCloudinary(req.file.buffer, 'job-portal/resumes', 'raw');
      resume = { url: file.secure_url, publicId: file.public_id };
    }

    const application = await Application.create({
      job: job._id,
      applicant: req.user._id,
      coverLetter: req.body.coverLetter,
      resume,
    });
    res.status(201).json({ application });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'You have already applied to this job' });
    next(error);
  }
}

export async function listApplications(req, res, next) {
  try {
    let applications;
    if (req.user.role === 'applicant') {
      // Applicant sees their own applications with job details
      applications = await Application.find({ applicant: req.user._id })
        .populate('job', 'title companyName location employmentType salary')
        .populate('applicant', 'name email avatar')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'recruiter') {
      // Recruiter sees applications only for their own jobs
      const myJobs = await Job.find({ recruiter: req.user._id }).select('_id');
      const jobIds = myJobs.map(j => j._id);
      applications = await Application.find({ job: { $in: jobIds } })
        .populate('job', 'title companyName location employmentType salary recruiter')
        .populate('applicant', 'name email avatar')
        .sort({ createdAt: -1 });
    } else {
      // Admin sees everything
      applications = await Application.find({})
        .populate('job', 'title companyName location employmentType salary recruiter')
        .populate('applicant', 'name email avatar')
        .sort({ createdAt: -1 });
    }
    res.json({ applications });
  } catch (error) { next(error); }
}

export async function updateApplicationStatus(req, res, next) {
  try {
    const validStatuses = ['submitted', 'reviewing', 'shortlisted', 'rejected', 'hired'];
    if (!validStatuses.includes(req.body.status))
      return res.status(400).json({ message: 'Invalid status' });

    const application = await Application.findById(req.params.id).populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (req.user.role !== 'admin' && !application.job.recruiter.equals(req.user._id))
      return res.status(403).json({ message: 'Not permitted' });

    application.status = req.body.status;
    await application.save();
    res.json({ application });
  } catch (error) { next(error); }
}
