# Quickstart Guide: View Application Detail (UC23)

**Feature**: View Application Detail  
**Prerequisites**: UC22 (View Application List) completed  
**Estimated Setup Time**: 30 minutes

---

## Prerequisites

- Node.js 18+ installed
- MySQL server running
- Prisma CLI installed (`npm install -g prisma`)
- UC22 implementation complete (Application module exists)
- Valid Staff JWT token for testing

---

## Setup Steps

### 1. Verify Database Schema

Check that Prisma schema includes required relationships:

```bash
cd backend
npx prisma db pull  # Sync schema from database
```

Verify in `prisma/schema.prisma`:
- `Application` model has `user` and `event` relations
- `User` model has `user_skills` relation
- `Event` model has `organization` relation

### 2. Run Database Migrations (if needed)

```bash
# If adding reviewed_at field or last_viewed_at
npx prisma migrate dev --name add_application_audit_fields
```

### 3. Verify Indexes

Check existing indexes:
```sql
SHOW INDEX FROM applications;
SHOW INDEX FROM user_skills;
```

Expected indexes:
- `idx_applications_event_status_created` (from UC22)
- `idx_applications_user` (NEW - for volunteer stats query)
- `idx_user_skills_user` (NEW - for skills JOIN)

Add missing indexes:
```sql
CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_user_skills_user ON user_skills(user_id);
```

### 4. Install Dependencies

```bash
cd backend
npm install  # Should already have all dependencies from UC22
```

### 5. Update share_context.md

Add UC23 API contract to `share_context.md`:

```markdown
### GET /api/v1/applications/:applicationId
**Owner**: TienTD  
**Purpose**: Staff view full application detail  
**Auth**: Staff, Manager  
**Response**: Full volunteer profile + application + stats
```

---

## Local Testing

### Test Data Setup

Create seed data with full volunteer profile:

```javascript
// backend/src/seeds/uc23-test-data.js
const testVolunteer = {
  id: 'volunteer-uuid-1',
  name: 'Nguyen Van A',
  email: 'test@example.com',
  phone_number: '+84901234567',
  user_skills: [
    { skill_name: 'First Aid', level: 'INTERMEDIATE' },
    { skill_name: 'Event Management', level: 'ADVANCED' }
  ]
};

const testApplication = {
  id: 'app-uuid-1',
  event_id: 'event-uuid-1',  // Event owned by Staff's org
  user_id: 'volunteer-uuid-1',
  status: 'SUBMITTED',
  motivation_letter: 'I am passionate about volunteering...',
  submitted_at: new Date()
};
```

Run seed:
```bash
node src/seeds/uc23-test-data.js
```

### Manual API Tests

#### Test 1: Valid Request (200 OK)
```bash
curl -X GET http://localhost:3000/api/v1/applications/app-uuid-1 \
  -H "Cookie: token=<staff_jwt_token>"
```

**Expected**: Full application detail with volunteer profile, skills, and stats

#### Test 2: Invalid UUID (400 Bad Request)
```bash
curl -X GET http://localhost:3000/api/v1/applications/invalid-id \
  -H "Cookie: token=<staff_jwt_token>"
```

**Expected**: `{"success": false, "error": {"code": "INVALID_UUID"}}`

#### Test 3: Not Found (404)
```bash
curl -X GET http://localhost:3000/api/v1/applications/00000000-0000-0000-0000-000000000000 \
  -H "Cookie: token=<staff_jwt_token>"
```

**Expected**: `{"success": false, "error": {"code": "NOT_FOUND"}}`

#### Test 4: Cross-Org Access (403 Forbidden)
```bash
# Staff A tries to view application from Org B's event
curl -X GET http://localhost:3000/api/v1/applications/app-from-org-b \
  -H "Cookie: token=<staff_a_token>"
```

**Expected**: `{"success": false, "error": {"code": "FORBIDDEN"}}`

#### Test 5: Unauthorized (401)
```bash
curl -X GET http://localhost:3000/api/v1/applications/app-uuid-1
# No token
```

**Expected**: `{"success": false, "error": {"code": "UNAUTHORIZED"}}`

---

## Integration Tests

Run Jest integration tests:

```bash
cd backend
npm test -- application-detail.test.js
```

Expected test cases:
- ✓ Should return 200 with full detail for valid request
- ✓ Should return 400 for invalid UUID format
- ✓ Should return 404 for non-existent application
- ✓ Should return 403 for cross-org access attempt
- ✓ Should return 401 without authentication
- ✓ Should NOT expose address or identity_card_number

---

## Troubleshooting

### Issue: Slow Query (>300ms)

**Symptom**: Response time exceeds 300ms target

**Debug**:
```sql
EXPLAIN SELECT * FROM applications 
WHERE id = 'app-uuid' 
-- Check if using index
```

**Solution**:
- Verify indexes exist on foreign keys
- Check MySQL slow query log
- Add covering indexes if needed

---

### Issue: Missing Volunteer Data

**Symptom**: `volunteer` object is null or incomplete

**Debug**:
- Check Prisma include syntax in repository
- Verify `user_id` foreign key integrity
- Check if user record exists

**Solution**:
```javascript
// Verify user exists
const user = await prisma.user.findUnique({ 
  where: { id: application.user_id } 
});
console.log('User found:', !!user);
```

---

### Issue: 403 Forbidden Errors

**Symptom**: Staff cannot view applications from their own org

**Debug**:
- Extract `organization_id` from JWT token
- Query event's `organization_id`
- Check if they match

**Solution**:
```javascript
console.log('Staff org:', staffOrganizationId);
console.log('Event org:', application.event.organization_id);
// Should be equal
```

---

### Issue: Statistics Calculation Wrong

**Symptom**: `events_joined` or `completion_rate` incorrect

**Debug**:
```javascript
// Manual count
const count = await prisma.application.count({
  where: { user_id: volunteerId, status: 'APPROVED' }
});
console.log('Expected events_joined:', count);
```

**Solution**: Check aggregate query logic, verify status enum values

---

## Performance Validation

Run load test with Artillery:

```yaml
# artillery-uc23.yml
config:
  target: http://localhost:3000
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: View Application Detail
    flow:
      - get:
          url: /api/v1/applications/app-uuid-1
          headers:
            Cookie: token=<jwt_token>
```

Run:
```bash
artillery run artillery-uc23.yml
```

**Target**: p95 latency < 300ms

---

## Next Steps

After UC23 is working:
1. Run `/speckit-tasks` to generate tasks.md
2. Implement UC24 (Approve Application)
3. Implement UC25 (Reject Application)
4. Add internal notes feature (from CONTEXT.md)

---

**Quickstart Complete** ✅
