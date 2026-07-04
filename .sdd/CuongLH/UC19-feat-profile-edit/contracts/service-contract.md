# Service Contract: ProfileService

## Method: updateProfile(userId, updateData, file)

**Purpose**: Xử lý logic cập nhật thông tin cá nhân và upload ảnh đại diện (nếu có).

**Signature**:

```javascript
async updateProfile(userId: number, updateData: object, file: Express.Multer.File | undefined)
```

**Logic**:

1. Lấy thông tin user hiện tại bằng `ProfileRepository.findUserById(userId)`.
2. Nếu không tìm thấy, throw `USER_NOT_FOUND`.
3. Nếu `file` tồn tại:
   - Nếu user đã có `avatar_url` cũ, extract public_id và gọi `CloudinaryService.deleteImage(public_id)`.
   - Upload `file` mới bằng `CloudinaryService.uploadImage(file.buffer)`.
   - Gán url mới vào biến cập nhật.
4. Format lại `updateData` (map `phone_number` -> `phone`).
5. Loại bỏ các field không hợp lệ (nếu có rò rỉ từ validation).
6. Gọi `ProfileRepository.updateUser(userId, finalUpdateData)`.
7. Trả về thông tin profile đã cập nhật (tương tự như API View Profile).
