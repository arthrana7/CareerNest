import multer from 'multer';
const storage = multer.memoryStorage();
const resumeFilter = (req, file, cb) => cb(null, ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mimetype));
const avatarFilter = (req, file, cb) => cb(null, file.mimetype.startsWith('image/'));
export const uploadResume = multer({ storage, fileFilter: resumeFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('resume');
export const uploadAvatar = multer({ storage, fileFilter: avatarFilter, limits: { fileSize: 2 * 1024 * 1024 } }).single('avatar');

