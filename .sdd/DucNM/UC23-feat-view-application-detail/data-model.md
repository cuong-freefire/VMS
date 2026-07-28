# Data Model: View Application Detail (UC23)

**Feature**: View Application Detail  
**Date**: 2026-06-29  
**Phase**: Phase 1 - Data Design  
**Status**: DESIGN COMPLETE — Updated to match actual Prisma schema v3.0

---

## Core Entities

### Application (Primary)

```prisma
model Application {
  id          Int               @id @default(autoincrement())
  userId      Int               @map("user_id")
  eventId     Int               @map("event_id")
  status      ApplicationStatus @default(PENDING)
  message     String?           @db.Text
  processedBy Int?              @map("processed_by")
  processedAt DateTime?         @map("processed_at")
  createdAt   DateTime          @default(now()) @map("created_at")
  updatedAt   DateTime          @updatedAt @map("updated_at")

  submittedByUser User  @relation("applicationSubmittedByUser", fields: [userId], references: [id])
  event           Event @relation(fields: [eventId], references: [id])
  processedByUser User? @relation("applicationProcessedByUser", fields: [processedBy], references: [id])

  @@unique([userId, eventId])
  @@index([userId, status])
  @@index([eventId, status])
  @@index([processedBy])
  @@map("applications")
}

enum ApplicationStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

### User (Volunteer Profile)

```prisma
model User {
  id            Int      @id @default(autoincrement())
  email         String   @unique @db.VarChar(255)
  passwordHash  String   @db.VarChar(255) @map("password_hash")
  fullName      String   @db.VarChar(255) @map("full_name")
  phone         String?  @db.VarChar(20)
  avatarUrl     String?  @db.VarChar(500) @map("avatar_url")
  roleId        Int      @map("role_id")
  isActive      Boolean  @default(true) @map("is_active")
  emailVerified Boolean  @default(false) @map("email_verified")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  userSkills UserSkill[]
}
```

### UserSkill (Skills)

```prisma
model UserSkill {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  skillId   Int      @map("skill_id")
  createdAt DateTime @default(now()) @map("created_at")

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  skill Skill @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@unique([userId, skillId])
  @@index([userId])
  @@index([skillId])
  @@map("user_skills")
}
```

### Skill

```prisma
model Skill {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(255)
  description String?  @db.Text
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  userSkills UserSkill[]
}
```

### Event (Context)

```prisma
model Event {
  id                   Int         @id @default(autoincrement())
  title                String      @db.VarChar(500)
  description          String      @db.Text
  location             String      @db.VarChar(500)
  startDate            DateTime    @map("start_date")
  endDate              DateTime    @map("end_date")
  applicationDeadline  DateTime    @map("application_deadline")
  maxCapacity          Int         @map("max_capacity")
  approvedParticipants Int         @default(0) @map("approved_participants")
  imageUrl             String?     @db.VarChar(500) @map("image_url")
  categoryId           Int         @map("category_id")
  createdBy            Int         @map("created_by")
  status               EventStatus @default(DRAFT)
  isActive             Boolean     @default(true) @map("is_active")
  createdAt            DateTime    @default(now()) @map("created_at")
  updatedAt            DateTime    @updatedAt @map("updated_at")

  createdByUser User @relation("createdByStaff", fields: [createdBy], references: [id])
  applications  Application[]
}
```

---

## Relationships

```
Application (1) ─── (1) User (Volunteer)
      │
      └─── (1) Event (for ownership context)
                  
User (1) ─── (N) UserSkill (N) ─── (1) Skill
```

---

## Query Pattern (Detail Fetch)

```javascript
// Actual implementation in application.repository.js
const application = await prisma.application.findUnique({
  where: { id },
  select: {
    id: true, userId: true, eventId: true,
    status: true, message: true,
    processedBy: true, processedAt: true,
    createdAt: true, updatedAt: true,
    submittedByUser: {
      select: {
        id: true, fullName: true, email: true,
        phone: true, avatarUrl: true,
        userSkills: {
          select: {
            skill: { select: { id: true, name: true } }
          }
        }
      }
    },
    event: {
      select: {
        id: true, title: true,
        startDate: true, endDate: true,
        createdBy: true
      }
    }
  }
});
```

---

## Response Format

```json
{
  "success": true,
  "message": "Lấy chi tiết đơn đăng ký thành công",
  "data": {
    "id": 1,
    "userId": 5,
    "eventId": 10,
    "status": "PENDING",
    "message": "Tôi muốn tham gia sự kiện này...",
    "processedBy": null,
    "processedAt": null,
    "createdAt": "2026-06-15T10:30:00.000Z",
    "updatedAt": "2026-06-15T10:30:00.000Z",
    "volunteer": {
      "id": 5,
      "fullName": "Nguyễn Văn A",
      "email": "nguyenvana@example.com",
      "phone": "+84901234567",
      "avatarUrl": "https://cloudinary.com/avatar.jpg",
      "skills": [
        { "id": 1, "name": "First Aid" },
        { "id": 2, "name": "Communication" }
      ]
    },
    "event": {
      "id": 10,
      "title": "Mùa Hè Xanh 2026",
      "startDate": "2026-07-15T08:00:00.000Z",
      "endDate": "2026-07-20T17:00:00.000Z"
    }
  }
}
```

---

## Security Constraints

1. **Event Creator Ownership**: Application.event.createdBy MUST match currentUser.user_id
2. **Sensitive Data Filtering**: NEVER expose passwordHash, isActive, roleId, emailVerified in API response
3. **No status auto-change**: Viewing detail does NOT change application status

---

## Indexes

```sql
-- Existing from Prisma schema
-- applications(user_id, status)
-- applications(event_id, status)
-- applications(processed_by)
-- user_skills(user_id)
-- user_skills(skill_id)
```

---

**Data Model Complete** ✅  
**Last Updated**: 2026-07-28