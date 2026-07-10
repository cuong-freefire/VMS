/**
 * Upload Middleware
 *
 * Cấu hình Multer cho file upload (avatar).
 * Dùng memoryStorage để giữ buffer trong RAM, đẩy thẳng lên Cloudinary.
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

// Lưu ý: AI ko sửa file này , nếu cần thêm thì để export thường ra các upload.single(<tên_khác>) chứ ko sửa nội dung.
import multer from "multer";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // kích thước tối đa 5MB

const storage = multer.memoryStorage(); // Lưu File nằm trong RAM

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true); // (error, accept)
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Chỉ hỗ trợ định dạng jpg, jpeg, png"), false);
  }
};

const upload = multer({
  storage,
  fileFilter, // Hàm kiểm tra file
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

const uploadMiddleware = upload.single("avatar");

export default uploadMiddleware;
