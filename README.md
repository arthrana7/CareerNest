# CareerNest 💼

A modern, full-stack job application platform featuring dedicated experiences for **Applicants** and **Recruiters**.

Built with React (Vite) on the frontend and Node.js / Express / MongoDB on the backend.

---

## ✨ Features

### 👤 Applicant Experience
- **Job Discovery & Search**: Filter jobs by keyword, location, job type (Full-time, Part-time, Remote, Contract), and sort by date.
- **Detailed Job Pages**: View comprehensive job descriptions, company information, salary ranges, requirements, and tags.
- **Quick Applications**: Apply directly with a resume and cover letter.
- **Application Tracking Dashboard**: Monitor application statuses in real-time (`Submitted`, `Under Review`, `Shortlisted`, `Rejected`, `Hired`).
- **Profile Management**: Update display name, profile avatar, and view account details.

### 🏢 Recruiter Experience
- **Job Management**: Create and publish new job postings with requirements, salary ranges, tags, company logo, and company description.
- **Edit & Delete Postings**: Update active listings or remove closed positions.
- **Applicant Review & Pipeline**: Review candidate details, view submitted resumes, read cover letters, and advance applicants through status stages.
- **Recruiter Dashboard**: Overview of all posted positions and active applicant counts.

### 🔒 Authentication & Security
- Secure JWT-based authentication with bcrypt password hashing.
- Role-based authorization (`applicant` vs `recruiter`).
- Cloudinary integration for resume and profile photo uploads.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router 6, Axios, Modern Vanilla CSS (DM Sans, DM Mono, Playfair Display typography)
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Multer, Cloudinary
- **Database**: MongoDB

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas URI

### 1. Clone the repository
```bash
git clone https://github.com/arthrana7/CareerNest.git
cd CareerNest
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Edit `.env` with your MongoDB URI, JWT secret, and optional Cloudinary credentials:
```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/job-portal
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📡 API Overview

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/auth/register` | POST | Public | Create new applicant or recruiter account |
| `/api/auth/login` | POST | Public | Log in and receive JWT token |
| `/api/auth/me` | GET | Authenticated | Retrieve current user profile |
| `/api/auth/profile` | PATCH | Authenticated | Update display name and avatar |
| `/api/jobs` | GET | Public | Search and list active jobs with filters |
| `/api/jobs/:id` | GET | Public | Get single job details |
| `/api/jobs` | POST | Recruiter | Post a new job |
| `/api/jobs/:id` | PUT | Recruiter | Update an existing job |
| `/api/jobs/:id` | DELETE | Recruiter | Delete a job posting |
| `/api/applications` | GET | Authenticated | List user applications or recruiter job applications |
| `/api/applications` | POST | Applicant | Submit a new job application |
| `/api/applications/:id/status` | PATCH | Recruiter | Update applicant review status |

---

## 📄 License
ISC
