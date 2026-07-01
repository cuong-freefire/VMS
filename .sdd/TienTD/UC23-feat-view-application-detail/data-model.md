# Data Model: View Application Detail (UC23)

**Feature**: View Application Detail  
**Date**: 2026-06-29  
**Phase**: Phase 1 - Data Design

---

## Core Entities

### Application (Primary)
```prisma
model Application {
  id                String   @id @default(uuid())
  event_id          String
  user_id           String
  status            ApplicationStatus @default(SUBMITTED)
  motivation_letter String?  @db.Text
  notes             String?  @db.Text
  submitted_at      DateTime @default(now())
  reviewed_at       DateTime?
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  // Relations
  event             Event    @relation(fields: [event_id], references: [id])
  user              User     @relation(fields: [user_id], references: [id])
  
  @@index([event_id, status, created_at(sort: Desc)])
  @@index([user_id])
}

enum ApplicationStatus {
  SUBMITTED
  REVIEWED
  APPROVED
  REJECTED
}
```

### User (Volunteer Profile)
```prisma
model User {
  id                   String   @id @default(uuid())
  name                 String
  email                String   @unique
  phone_number         String?
  avatar_url           String?
  address              String?  // NOT exposed in API
  identity_card_number String?  // NOT exposed in API
  organization_id      String?
  role                 UserRole
  is_active            Boolean  @default(true)
  
  // Relations
  applications         Application[]
  user_skills          UserSkill[]
  organization         Organization? @relation(fields: [organization_id], references: [id])
}
```

### UserSkill (Skills)
```prisma
model UserSkill {
  id         String @id @default(uuid())
  user_id    String
  skill_name String
  level      SkillLevel
  
  // Relations
  user       User   @relation(fields: [user_id], references: [id])
  
  @@index([user_id])
}

enum SkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}
```

### Event (Context)
```prisma
model Event {
  id              String   @id @default(uuid())
  name            String
  organization_id String
  start_date      DateTime
  end_date        DateTime
  status          EventStatus
  is_active       Boolean  @default(true)
  
  // Relations
  organization    Organization @relation(fields: [organization_id], references: [id])
  applications    Application[]
  
  @@index([organization_id, is_active])
}
```

---

## Relationships

```
Application (1) ─── (1) User (Volunteer)
      │
      └─── (1) Event ─── (1) Organization
                 
User (1) ─── (N) UserSkill
```

---

## Query Pattern (Detail Fetch)

```javascript
const application = await prisma.application.findUnique({
  where: { id: applicationId },
  include: {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        avatar_url: true,
        user_skills: {
          select: {
            id: true,
            skill_name: true,
            level: true
          }
        }
      }
    },
    event: {
      select: {
        id: true,
        name: true,
        start_date: true,
        end_date: true,
        organization_id: true
      }
    }
  }
});
```

---

## Volunteer Statistics Calculation

```javascript
// Aggregate query for volunteer history
const volunteerStats = await prisma.application.aggregate({
  where: {
    user_id: application.user_id,
    status: 'APPROVED'
  },
  _count: { id: true },
  _sum: { volunteer_hours: true }
});

// Completion rate calculation
const completedEvents = await prisma.application.count({
  where: {
    user_id: application.user_id,
    status: 'APPROVED',
    event: {
      status: 'COMPLETED'
    }
  }
});

const stats = {
  events_joined: volunteerStats._count.id,
  events_completed: completedEvents,
  completion_rate: (completedEvents / volunteerStats._count.id) * 100,
  total_volunteer_hours: volunteerStats._sum.volunteer_hours || 0
};
```

---

## Security Constraints

1. **Organization Ownership**: Application.event.organization_id MUST match Staff.organization_id
2. **Sensitive Data Filtering**: NEVER expose `address`, `identity_card_number` in API response
3. **Audit Logging**: Log every detail view with `{ staff_id, application_id, volunteer_id, timestamp }`

---

## Indexes Required

```sql
-- Existing from UC22
CREATE INDEX idx_applications_event_status_created 
ON applications(event_id, status, created_at DESC);

CREATE INDEX idx_events_org 
ON events(organization_id, is_active);

-- New for UC23
CREATE INDEX idx_user_skills_user 
ON user_skills(user_id);

CREATE INDEX idx_applications_user 
ON applications(user_id);
```

---

**Data Model Complete** ✅
