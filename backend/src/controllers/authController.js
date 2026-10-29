import User from "../models/User.js";
import bcrypt from "bcrypt";
import { cookieOptions, createToken } from "../utils/token.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
});

export async function register(req, res, next) {
  try {
    const { name, email, password, role = "applicant" } = req.body;
    if (!["applicant", "recruiter"].includes(role))
      return res.status(400).json({ message: "Only applicant or recruiter registration is allowed" });
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword, role });
    res.status(201).cookie("token", createToken(user._id), cookieOptions).json({ user: safeUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That email is already registered" });
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchesPassword(password)))
      return res.status(401).json({ message: "Incorrect email or password" });
    res.cookie("token", createToken(user._id), cookieOptions).json({ user: safeUser(user) });
  } catch (error) { next(error); }
}

export function logout(req, res) {
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined }).status(204).send();
}

export const currentUser = (req, res) => res.json({ user: safeUser(req.user) });

export async function updateRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!['applicant', 'recruiter'].includes(role))
      return res.status(400).json({ message: 'Invalid role. Must be applicant or recruiter.' });
    req.user.role = role;
    await req.user.save();
    res.json({ user: safeUser(req.user) });
  } catch (error) { next(error); }
}

export async function updateProfile(req, res, next) {
  try {
    const { name } = req.body;
    if (name && name.trim()) req.user.name = name.trim();

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'job-portal/avatars', 'image');
      req.user.avatar = { url: result.secure_url, publicId: result.public_id };
    }

    await req.user.save();
    res.json({ user: safeUser(req.user) });
  } catch (error) { next(error); }
}
