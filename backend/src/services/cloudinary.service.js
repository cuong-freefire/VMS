/**
 * Cloudinary Service
 *
 * Wrapper cho Cloudinary SDK.
 * Xử lý upload ảnh từ buffer, xóa ảnh qua public_id, và extract public_id từ URL.
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import cloudinary from "../config/cloudinary.config.js";
import logger from "../config/logger.config.js";

/**
 * Upload ảnh từ buffer lên Cloudinary.
 *
 * @param {Buffer} fileBuffer - Buffer của file ảnh từ Multer memoryStorage
 * @returns {Promise<{public_id: string, secure_url: string}>}
 */
export const uploadImage = (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Xóa ảnh khỏi Cloudinary bằng public_id.
 * Nếu thất bại, log warning — KHÔNG throw để không block luồng chính.
 *
 * @param {string} publicId - Cloudinary public_id của ảnh
 * @returns {Promise<Object>} Kết quả từ Cloudinary API
 */
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
    return result;
  } catch (error) {
    logger.warn("Cloudinary delete image failed", {
      publicId,
      error: error.message,
    });
    return { result: "not found" };
  }
};

/**
 * Trích xuất public_id từ Cloudinary URL.
 *
 * Pattern: https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<folder>/<public_id>.<format>
 *
 * @param {string} avatarUrl - Cloudinary URL của ảnh
 * @returns {string|null} public_id hoặc null nếu không parse được
 */
export const extractPublicId = (avatarUrl) => {
  if (!avatarUrl) return null;

  try {
    const url = new URL(avatarUrl);
    const pathParts = url.pathname.split("/");

    // Tìm vị trí của "upload" trong path
    const uploadIndex = pathParts.indexOf("upload");
    if (uploadIndex === -1) return null;

    // public_id là tất cả phần tử sau version (vXXXXX)
    const afterUpload = pathParts.slice(uploadIndex + 1);
    // Bỏ qua version segment (v1234567)
    const publicIdParts = afterUpload.filter((part) => !part.startsWith("v"));

    // Ghép lại và bỏ extension
    const publicIdWithExt = publicIdParts.join("/");
    const lastDotIndex = publicIdWithExt.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      return publicIdWithExt.substring(0, lastDotIndex);
    }

    return publicIdWithExt;
  } catch {
    return null;
  }
};
