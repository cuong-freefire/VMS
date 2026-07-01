# Quickstart Guide: View Feedback Detail (UC50)

**Feature**: View Feedback Detail  
**Date**: 2026-07-01  
**Owner**: Member 3 - TienTD

---

## Overview

UC50 là READ-ONLY detail view cho phép Staff xem toàn bộ nội dung feedback từ volunteers. Guide này giúp developers nhanh chóng setup môi trường và test feature trong vòng 5-10 phút.

**What You'll Learn**:
- Cách start backend + frontend development servers
- Cách test API endpoint với curl/Postman
- Cách test UI flow từ UC49 → UC50 → Back
- Cách run automated tests

---

## Prerequisites

### System Requirements

**Software**:
- Node.js 18+ (check: `node --version`)
- MySQL 8.0+ (running on port 3306)
- Git (for cloning repo)

**IDE** (recommended):
- Visual Studio Code với extensions:
  - ESLint
  - Prettier
  - Prisma

### Project Setup (One-Time)

**1. Clone Repository**:
```bash
git checkout Dev
git pull origin Dev
git checkout -b 050-feat-feedback-detail
```

**2. Install Dependencies**:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

**3. Configure Environment**:
```bash
# Backend: Copy .env.example → .env
cp backend/.env.example backend/.env

# Edit backend/.env:
DATABASE_URL="mysql://root:password@localhost:3306/vms_dev"
JWT_SECRET="your-super-secret-key-change-this-in-production"
```

**4. Setup Database**:
```bash
cd backend
npx prisma migrate dev  # Run migrations
npx prisma db seed      # Seed test data
```

---

## Starting Development Servers

### Backend (Port 5000)

**Terminal 1**:
```bash
cd backend
npm run dev
```

**Expected Output**:
```
[INFO] Server running on http://localhost:5000
[INFO] Swagger docs: http://localhost:5000/api-docs
[INFO] Database connected successfully
```

**Health Check**:
```bash
curl http://localhost:5000/health
# Expected: {"status":"ok"}
```

---

### Frontend (Port 3000)

**Terminal 2**:
```bash
cd frontend
npm start
```

**Expected Output**:
```
Compiled successfully!
Local: http://localhost:3000
```

**Browser**: Navigate to http://localhost:3000

---

## Testing the API

### 1. Login to Get JWT Token

**Request**:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@org1.com",
    "password": "Staff123!"
  }' \
  -c cookies.txt
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "staff-uuid",
      "email": "staff@org1.com",
      "role": "STAFF"
    }
  }
}
```

**Token Stored**: Check `cookies.txt` file for JWT cookie.

---

### 2. Get Feedback Detail

**Find a Test Feedback ID**:
```bash
# List feedbacks to get valid ID
curl -X GET http://localhost:5000/api/v1/feedbacks \
  -b cookies.txt
```

**Request Feedback Detail**:
```bash
# Replace {feedback-id} with actual UUID from seed data
curl -X GET http://localhost:5000/api/v1/feedbacks/{feedback-id} \
  -b cookies.txt \
  -H "Accept: application/json"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "feedback": {
      "id": "f7b3c1a0-1234-4567-89ab-cdef01234567",
      "rating": 5,
      "comment": "Great event!\nThank you.",
      "is_anonymous": false,
      "created_at": "2026-06-20T15:30:00.000Z",
      "volunteer": {
        "id": "volunteer-uuid",
        "full_name": "Nguyễn Văn A",
        "avatar_url": "https://cloudinary.com/..."
      },
      "event": {
        "id": "event-uuid",
        "title": "Beach Cleanup 2026",
        "start_date": "2026-06-15T08:00:00.000Z",
        "end_date": "2026-06-15T17:00:00.000Z"
      },
      "images": []
    }
  }
}
```

---

### 3. Test Error Cases

**Invalid UUID Format** (400):
```bash
curl -X GET http://localhost:5000/api/v1/feedbacks/invalid-uuid \
  -b cookies.txt
# Expected: {"success": false, "error": "Invalid feedback ID format"}
```

**Missing Authentication** (401):
```bash
curl -X GET http://localhost:5000/api/v1/feedbacks/{feedback-id}
# No -b cookies.txt
# Expected: 401 Unauthorized
```

**Non-Existent Feedback** (404):
```bash
curl -X GET http://localhost:5000/api/v1/feedbacks/00000000-0000-0000-0000-000000000000 \
  -b cookies.txt
# Expected: 404 Not Found
```

---

## Testing the UI

### 1. Login to Frontend

**Steps**:
1. Navigate to http://localhost:3000/login
2. Enter credentials:
   - Email: `staff@org1.com`
   - Password: `Staff123!`
3. Click "Login"
4. Verify redirect to Dashboard

---

### 2. Navigate to Feedback List (UC49)

**Steps**:
1. Click "Feedbacks" in sidebar navigation
2. Verify feedback list loads (UC49)
3. Check that feedbacks are displayed in DataGrid

**Expected UI**:
- Table với columns: Volunteer, Event, Rating, Comment (truncated), Date
- Pagination controls at bottom
- Filter controls at top (optional)

---

### 3. View Feedback Detail (UC50)

**Steps**:
1. Click on any feedback row
2. Verify redirect to `/feedbacks/{id}` (UC50 detail page)
3. Check displayed information:
   - ✅ Full comment (with line breaks, no truncation)
   - ✅ Volunteer name + avatar (or "Anonymous")
   - ✅ Event title + dates
   - ✅ Rating stars (1-5)
   - ✅ Timestamp

**Test Cases**:
- **Non-Anonymous Feedback**: Volunteer info displayed
- **Anonymous Feedback**: Shows "Anonymous" với generic avatar
- **Long Comment**: Scroll works, no UI breaking

---

### 4. Back Navigation

**Steps**:
1. While on feedback detail page (UC50)
2. Click "Back to List" button
3. Verify redirect to `/feedbacks` (UC49)
4. **Important**: Check if filters/page preserved from before

**Expected Behavior**:
- If UC49 had filters applied → Filters still active after back
- If UC49 was on page 3 → Still on page 3 after back
- If no previous state → Clean list (page 1, no filters)

---

### 5. Image Lightbox (If Images Available)

**Note**: MVP doesn't include images in UC48, so this feature is placeholder.

**Steps** (when images added later):
1. View feedback with attached images
2. Click on thumbnail
3. Verify full-size image opens in lightbox (Material UI Dialog)
4. Click outside or close button to dismiss

---

## Running Automated Tests

### Backend Unit Tests

**Test Service Layer**:
```bash
cd backend
npm test -- feedback.service.test.js
```

**Expected Output**:
```
 PASS  tests/unit/feedback.service.test.js
  FeedbackService.getFeedbackDetail
    ✓ returns feedback when valid ID and organization (25ms)
    ✓ throws NotFoundError when feedback not found (15ms)
    ✓ throws ForbiddenError when wrong organization (18ms)
    ✓ handles anonymous feedback correctly (20ms)

Tests: 4 passed, 4 total
Coverage: 85% (service layer)
```

---

### Backend Integration Tests

**Test API Endpoints**:
```bash
cd backend
npm test -- feedback.test.js --grep "GET /feedbacks/:id"
```

**Expected Output**:
```
 PASS  tests/integration/feedback.test.js
  GET /api/v1/feedbacks/:id
    ✓ returns 200 OK with full feedback data (45ms)
    ✓ returns 200 OK for anonymous feedback (40ms)
    ✓ returns 400 for invalid UUID format (30ms)
    ✓ returns 401 when not authenticated (25ms)
    ✓ returns 403 for VOLUNTEER role (35ms)
    ✓ returns 404 for wrong organization (38ms)
    ✓ returns 404 for non-existent feedback (32ms)
    ✓ preserves line breaks in comment (42ms)

Tests: 8 passed, 8 total
```

---

### Frontend Component Tests

**Test React Components**:
```bash
cd frontend
npm test -- FeedbackDetailPage.test.jsx
```

**Expected Output**:
```
 PASS  src/pages/__tests__/FeedbackDetailPage.test.jsx
  FeedbackDetailPage
    ✓ renders loading skeleton initially (55ms)
    ✓ displays feedback data after fetch (120ms)
    ✓ shows Anonymous for anonymous feedback (110ms)
    ✓ preserves line breaks in comment (95ms)
    ✓ handles 404 error gracefully (85ms)
    ✓ back button navigates correctly (100ms)

Tests: 6 passed, 6 total
Coverage: 78% (components)
```

---

### E2E Navigation Test

**Test Full Flow**:
```bash
cd frontend
npm test -- feedback-flow.test.jsx
```

**Test Scenario**:
1. User lands on UC49 with filters applied
2. Clicks on feedback row
3. Detail page (UC50) loads
4. Clicks "Back to List"
5. Verify UC49 still has same filters/page

**Expected**: All steps pass, no console errors.

---

## Common Issues & Troubleshooting

### Issue 1: Port Already in Use

**Symptom**:
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

---

### Issue 2: Database Connection Failed

**Symptom**:
```
[ERROR] PrismaClientInitializationError: Can't reach database server
```

**Solution**:
1. Check MySQL is running: `mysql -u root -p`
2. Verify DATABASE_URL in `.env`
3. Check database exists: `SHOW DATABASES;`
4. Run migrations: `npx prisma migrate dev`

---

### Issue 3: JWT Token Not Persisted

**Symptom**: API returns 401 even after login

**Solution**:
1. Check browser cookies: DevTools → Application → Cookies
2. Verify `jwt` cookie exists with HttpOnly flag
3. Check Axios config: `withCredentials: true`
4. Verify CORS config allows credentials

---

### Issue 4: Frontend Shows 404 for Valid Feedback

**Symptom**: API works in Postman, but frontend gets 404

**Root Cause**: Staff's organization ≠ event's organization

**Solution**:
1. Login with correct Staff account
2. Check seed data: Staff and Event must belong to same org
3. Verify JWT token organization_id matches event.organization_id

---

### Issue 5: Line Breaks Not Displayed

**Symptom**: Comment shows as single line

**Solution**:
1. Check CSS: `whiteSpace: 'pre-wrap'` on Typography component
2. Verify API returns `\n` in comment
3. Ensure React doesn't strip whitespace

---

## Performance Benchmarks

### Expected Metrics

**API Response Time** (localhost):
```bash
# Test with Apache Bench
ab -n 100 -c 10 -C "jwt=<TOKEN>" \
  http://localhost:5000/api/v1/feedbacks/{id}
```

**Expected Results**:
- Mean response time: ~80ms
- p95: < 150ms
- p99: < 300ms
- 0% failed requests

**Frontend Page Load** (Chrome DevTools):
- First Contentful Paint: < 500ms
- Time to Interactive: < 1s
- Total page weight: < 100KB

---

## Seed Data Reference

### Test Accounts

| Email | Password | Role | Org ID |
|-------|----------|------|--------|
| `staff@org1.com` | `Staff123!` | STAFF | 1 |
| `staff@org2.com` | `Staff123!` | STAFF | 2 |
| `volunteer@example.com` | `Volunteer123!` | VOLUNTEER | 1 |

### Test Feedbacks

**Seed data creates**:
- 5 feedbacks for Org 1 events
- 3 feedbacks for Org 2 events
- 2 anonymous feedbacks
- 1 feedback with very long comment (for UI testing)

**Access**:
- `staff@org1.com` can view feedbacks from Org 1 events only
- `staff@org2.com` can view feedbacks from Org 2 events only
- Cross-org access returns 404

---

## Next Steps After Testing

### 1. Code Review Checklist

Before submitting PR:
- [ ] All tests passing (backend + frontend)
- [ ] ESLint 0 errors
- [ ] No console.log statements
- [ ] Swagger documentation complete
- [ ] Performance benchmarks met

### 2. Manual QA Checklist

- [ ] Test với different roles (STAFF, MANAGER, ADMIN, VOLUNTEER)
- [ ] Test với anonymous feedback
- [ ] Test với very long comments (10k+ characters)
- [ ] Test cross-organization access denial
- [ ] Test back navigation preserves state
- [ ] Test in multiple browsers (Chrome, Firefox, Safari)

### 3. Deploy to Staging

```bash
# After PR approval
git checkout Dev
git pull origin Dev
git merge 050-feat-feedback-detail
git push origin Dev

# Deploy script (if applicable)
npm run deploy:staging
```

---

## Additional Resources

**Documentation**:
- Full Spec: `.sdd/TienTD/UC50-feat-feedback-detail/spec.md`
- Implementation Plan: `.sdd/TienTD/UC50-feat-feedback-detail/plan.md`
- API Contract: `.sdd/TienTD/UC50-feat-feedback-detail/contracts/api-endpoints.md`
- Data Model: `.sdd/TienTD/UC50-feat-feedback-detail/data-model.md`

**Related Features**:
- UC48: Submit Feedback (volunteer creates feedback)
- UC49: View Feedback List (Staff views list before detail)

**Help & Support**:
- Team Lead: Member 3 - TienTD
- Slack Channel: `#vms-feedback-module`
- Issue Tracker: GitHub Issues

---

**Quickstart Status**: ✅ READY FOR USE

**Last Updated**: 2026-07-01  
**Maintainer**: Member 3 - TienTD
