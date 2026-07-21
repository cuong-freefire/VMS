# Quickstart Guide: UC15 Add Event

**Feature**: Staff tạo sự kiện tình nguyện mới  
**Owner**: DucNM (Event Management Module)  
**Last Updated**: 2026-07-18

**Consistency Check**: Aligned with Prisma schema v3.0, no Organization model.

---

## Prerequisites

- ✅ **Node.js** 18.x hoặc mới hơn
- ✅ **MySQL** 8.0+ đang chạy
- ✅ **npm** hoặc **yarn** package manager
- ✅ **Cloudinary account** (free tier) cho image upload

---

## Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/your-org/VMS.git
cd VMS
```

### 2. Configure Environment Variables

Tạo file `.env` trong folder `backend/`:

```bash
cd backend
cp .env.example .env
```

### 3. Install Dependencies

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 4. Database Setup

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start Backend

```bash
npm run dev
```

### 6. Start Frontend (New Terminal)

```bash
cd frontend
npm start
```

---

## Testing the Feature

### Test via API (cURL)

#### Step 1: Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@org.com","password":"password123"}' \
  -c cookies.txt
```

#### Step 2: Create Event

```bash
curl -X POST http://localhost:5000/api/v1/events \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Test Event",
    "description": "This is a test volunteer event with at least 50 characters to pass validation.",
    "startDate": "2026-08-01T09:00:00.000Z",
    "endDate": "2026-08-05T17:00:00.000Z",
    "applicationDeadline": "2026-07-30T23:59:59.000Z",
    "location": "Hanoi, Vietnam",
    "maxCapacity": 30,
    "categoryId": 1
  }'
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Tạo sự kiện thành công",
  "data": {
    "id": 4,
    "title": "Test Event",
    "status": "DRAFT",
    "createdBy": 3,
    "createdAt": "2026-06-29T15:30:00.000Z",
    "updatedAt": "2026-06-29T15:30:00.000Z"
  }
}
```

---

## Related Documentation

- **Feature Specification**: `SPEC.md`
- **Implementation Plan**: `plan.md`
- **Data Model**: `data-model.md`
- **API Contract**: `contracts/POST-events.md`
- **Database Schema**: `backend/prisma/schema.prisma`

---

**Version**: 2.0
**Last Updated**: 2026-07-18