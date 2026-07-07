/**
 * Upload Middleware
 *
 * Cấu hình Multer cho file upload (avatar).
 * Dùng memoryStorage để giữ buffer trong RAM, đẩy thẳng lên Cloudinary.
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import multer from "multer";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Chỉ hỗ trợ định dạng jpg, jpeg, png"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

const uploadMiddleware = upload.single("avatar");

export default uploadMiddleware;
