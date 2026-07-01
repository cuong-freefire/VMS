# CROSS_DEPENDENCIES.md — VMS Cross-Module Dependencies

**Version**: 1.0  
**Last Updated**: 2026-06-28  
**Purpose**: Định nghĩa các service và middleware dùng chéo giữa các thành viên

---

## 1. Service Dependencies (Ai làm gì, ai dùng cái gì)

### 1.1 Member 1 - CuongLH: Auth, User, Email Services

#### Services CuongLH OWNS (làm và maintain)

**AuthService** (`backend/src/services/auth.service.js`)

```javascript
class AuthService {
  // Public contracts for other modules:
  async validateToken(token)              // → { userId, role, email } | null
  async getUserById(userId)               // → User object | null
  async verifyUserRole(userId, requiredRole)  // → boolean
}
```

**EmailService** (`backend/src/services/email.service.js`)

```javascript
class EmailService {
  // Public contracts for other modules:
  async sendApplicationApproved(userEmail, eventName)
  async sendApplicationRejected(userEmail, eventName, reason)
  async sendCertificateReady(userEmail, eventName, certificateUrl)
  async sendEventReminder(userEmail, eventName, eventDate)
  async sendDonationReceipt(userEmail, amount, transactionId)
}
```

**UserService** (`backend/src/services/user.service.js`)

```javascript
class UserService {
  // Public contracts for other modules:
  async getUserById(userId)                    // → User | null
  async getUsersByIds(userIds)                 // → User[]
  async isUserActive(userId)                   // → boolean
  async getUserRole(userId)                    // → 'VOLUNTEER' | 'STAFF' | 'MANAGER' | 'ADMIN'
}
```

#### Middleware CuongLH OWNS

**authenticate** (`backend/src/middlewares/auth.middleware.js`)

```javascript
// Verify JWT cookie, inject req.user = { id, email, role }
// Usage: All protected routes MUST use this
```

**authorize(roles)** (`backend/src/middlewares/auth.middleware.js`)

```javascript
// Check if req.user.role is in allowed roles
// Usage: authorize(['STAFF', 'ADMIN'])
```

---

### 1.2 Member 2 - NamLD: EventDiscovery, Application, Feedback Services

#### Services NamLD OWNS

**ApplicationService** (`backend/src/services/application.service.js`)

```javascript
class ApplicationService {
  constructor(eventService, emailService) { ... }  // DI từ Member 3 và Member 1
  
  // Public contracts for other modules:
  async getApplicationById(applicationId)      // → Application | null
  async getApplicationsByEventId(eventId)      // → Application[]
  async hasUserApplied(userId, eventId)        // → boolean
  async getApprovedApplicationsCount(eventId)  // → number
}
```

**FeedbackService** (`backend/src/services/feedback.service.js`)

```javascript
class FeedbackService {
  // Public contracts for other modules:
  async getFeedbacksByEventId(eventId)         // → Feedback[]
  async getAverageRating(eventId)              // → number (1-5)
}
```

#### NamLD DEPENDS ON

- **EventService** (Member 3): Để check event capacity trước khi approve application
- **EmailService** (Member 1): Để gửi email khi application status thay đổi

---

### 1.3 Member 3 - TienTD: Event, Attendance, Certificate Services

#### Services TienTD OWNS

**EventService** (`backend/src/services/event.service.js`)

```javascript
class EventService {
  // Public contracts for other modules:
  async getEventById(eventId)                  // → Event | null
  async isEventActive(eventId)                 // → boolean
  async getEventCapacity(eventId)              // → { max_capacity, current_participants }
  async incrementParticipantCount(eventId)     // → void (for approved applications)
  async decrementParticipantCount(eventId)     // → void (for cancelled applications)
  async getEventsByOrganizationId(orgId)       // → Event[]
}
```

**AttendanceService** (`backend/src/services/attendance.service.js`)

```javascript
class AttendanceService {
  constructor(applicationService) { ... }      // DI từ Member 2
  
  // Public contracts for other modules:
  async hasAttended(applicationId)             // → boolean
  async getAttendanceByApplicationId(appId)    // → Attendance | null
}
```

**CertificateService** (`backend/src/services/certificate.service.js`)

```javascript
class CertificateService {
  constructor(attendanceService, applicationService, emailService) { ... }
  
  // Public contracts for other modules:
  async getCertificatesByUserId(userId)        // → Certificate[]
}
```

#### TienTD DEPENDS ON

- **ApplicationService** (Member 2): Để verify application status trước khi check-in
- **AttendanceService** (own): Để verify attendance trước khi generate certificate
- **EmailService** (Member 1): Để gửi email khi certificate ready

---

### 1.4 Member 4 - AnhND: UserManagement, Category, Skill Services

#### Services AnhND OWNS

**UserManagementService** (`backend/src/services/user-management.service.js`)

```javascript
class UserManagementService {
  // Public contracts for other modules:
  async getAllUsers(filters, pagination)       // → { users[], total }
  async updateUserRole(userId, newRole)        // → User
  async deactivateUser(userId)                 // → void
}
```

**CategoryService** (`backend/src/services/category.service.js`)

```javascript
class CategoryService {
  // Public contracts for other modules:
  async getAllCategories()                     // → Category[]
  async getCategoryById(categoryId)            // → Category | null
  async isCategoryActive(categoryId)           // → boolean
}
```

**SkillService** (`backend/src/services/skill.service.js`)

```javascript
class SkillService {
  // Public contracts for other modules:
  async getAllSkills()                         // → Skill[]
  async getSkillById(skillId)                  // → Skill | null
  async isSkillActive(skillId)                 // → boolean
}
```

#### AnhND DEPENDS ON

- **EventService** (Member 3): Để aggregate event statistics cho admin dashboard
- **ApplicationService** (Member 2): Để aggregate application statistics

---

### 1.5 Member 5 - DucNM: Organization, Notification, Dashboard, Payment Services

#### Services DucNM OWNS

**OrganizationService** (`backend/src/services/organization.service.js`)

```javascript
class OrganizationService {
  // Public contracts for other modules:
  async getOrganizationById(orgId)             // → Organization | null
  async isOrganizationActive(orgId)            // → boolean
  async getAllOrganizations()                  // → Organization[]
}
```

**NotificationService** (`backend/src/services/notification.service.js`)

```javascript
class NotificationService {
  constructor(emailService) { ... }            // DI từ Member 1
  
  // Public contracts for other modules:
  async createNotification(userId, type, message, metadata)  // → Notification
  async sendApplicationNotification(userId, applicationId, status)
  async sendEventReminder(userId, eventId)
  async sendCertificateNotification(userId, certificateId)
}
```

**DashboardService** (`backend/src/services/dashboard.service.js`)

```javascript
class DashboardService {
  constructor(eventService, applicationService, userService) { ... }
  
  // Public contracts for other modules:
  async getVolunteerStats(userId)              // → { total_events, total_hours, certificates }
  async getStaffStats(staffId)                 // → { created_events, total_participants }
  async getAdminStats()                        // → { total_users, total_events, total_donations }
}
```

**PaymentService** (`backend/src/services/payment.service.js`)

```javascript
class PaymentService {
  // Public contracts for other modules:
  async createPaymentIntent(userId, amount, metadata)  // → { payment_id, payment_url }
  async verifyPaymentCallback(paymentData)             // → { success, transaction_id }
}
```

#### DucNM DEPENDS ON

- **EmailService** (Member 1): Để gửi donation receipt
- **EventService** (Member 3): Để aggregate event stats
- **ApplicationService** (Member 2): Để aggregate application stats
- **UserService** (Member 1): Để get user info cho dashboard

---

## 2. Middleware Dependencies (Ai dùng middleware nào)

### 2.1 Authentication Middleware (Member 1)

**File**: `backend/src/middlewares/auth.middleware.js`

**Owner**: Member 1 - CuongLH

**Functions**:

```javascript
export const authenticate = async (req, res, next) => {
  // Verify JWT from cookie, inject req.user = { id, email, role }
}

export const authorize = (roles) => async (req, res, next) => {
  // Check if req.user.role is in allowed roles array
}
```

**Ai phải dùng**:

| Member | Routes cần authenticate | Routes cần authorize |
|--------|------------------------|---------------------|
| Member 1 | `/profile/*`, `/auth/logout` | - |
| Member 2 | `/applications/*`, `/feedback/*`, `/certificates/me` | authorize(['VOLUNTEER']) |
| Member 3 | `/staff/events/*`, `/staff/applications/*`, `/attendance/*` | authorize(['STAFF', 'MANAGER']) |
| Member 4 | `/admin/users/*`, `/admin/categories/*`, `/admin/skills/*` | authorize(['ADMIN', 'MANAGER']) |
| Member 5 | `/organizations/*`, `/donations/*`, `/dashboard/*` | Mixed (depends on route) |

---

### 2.2 Validation Middleware (Shared)

**Pattern**: Mỗi member tự tạo Zod schemas cho module của mình

**Shared Utility**: `backend/src/middlewares/validate.middleware.js`

```javascript
export const validate = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}
```

**Usage Example**:

```javascript
// Member 2 route
router.post('/applications', 
  authenticate, 
  validate(applicationSchema),  // Own schema
  applicationController.create
);
```

---

### 2.3 Error Handling Middleware (Shared)

**File**: `backend/src/middlewares/error.middleware.js`

**Owner**: Shared (member nào setup backend đầu tiên)

```javascript
export const errorHandler = (err, req, res, next) => {
  logger.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
}
```

**Ai phải dùng**: Tất cả members (global middleware)

---

## 3. Cross-Module Call Flow Examples

### Example 1: Approve Application (Member 3 calls Member 2, Member 1)

```javascript
// backend/src/services/application.service.js (Member 2 + Member 3)
class ApplicationService {
  constructor(eventService, emailService) {
    this.eventService = eventService;      // From Member 3
    this.emailService = emailService;      // From Member 1
  }

  async approveApplication(applicationId, reviewerId) {
    const application = await this.repository.findById(applicationId);
    
    // Call Member 3's EventService
    const capacity = await this.eventService.getEventCapacity(application.event_id);
    if (capacity.current_participants >= capacity.max_capacity) {
      throw new Error('Event capacity full');
    }
    
    // Update application
    await this.repository.updateStatus(applicationId, 'APPROVED');
    await this.eventService.incrementParticipantCount(application.event_id);
    
    // Call Member 1's EmailService
    const user = await this.userService.getUserById(application.user_id);
    await this.emailService.sendApplicationApproved(user.email, application.event.name);
    
    return application;
  }
}
```

---

### Example 2: Generate Certificate (Member 3 calls Member 2, Member 1, Member 5)

```javascript
// backend/src/services/certificate.service.js (Member 3)
class CertificateService {
  constructor(attendanceService, applicationService, emailService, notificationService) {
    this.attendanceService = attendanceService;    // From Member 3 (own)
    this.applicationService = applicationService;  // From Member 2
    this.emailService = emailService;              // From Member 1
    this.notificationService = notificationService; // From Member 5
  }

  async generateCertificate(applicationId) {
    // Verify attendance (own service)
    const hasAttended = await this.attendanceService.hasAttended(applicationId);
    if (!hasAttended) {
      throw new Error('User did not attend event');
    }
    
    // Get application details (Member 2)
    const application = await this.applicationService.getApplicationById(applicationId);
    
    // Generate certificate URL (Cloudinary logic here)
    const certificateUrl = await this.cloudinaryService.generate(...);
    
    // Save to database
    const certificate = await this.repository.create({
      application_id: applicationId,
      certificate_url: certificateUrl
    });
    
    // Notify user (Member 5)
    await this.notificationService.sendCertificateNotification(
      application.user_id, 
      certificate.id
    );
    
    // Send email (Member 1)
    await this.emailService.sendCertificateReady(
      application.user.email,
      application.event.name,
      certificateUrl
    );
    
    return certificate;
  }
}
```

---

### Example 3: Dashboard Stats (Member 5 calls Member 1, Member 2, Member 3)

```javascript
// backend/src/services/dashboard.service.js (Member 5)
class DashboardService {
  constructor(eventService, applicationService, userService) {
    this.eventService = eventService;          // From Member 3
    this.applicationService = applicationService; // From Member 2
    this.userService = userService;            // From Member 1
  }

  async getVolunteerStats(userId) {
    // Verify user exists (Member 1)
    const user = await this.userService.getUserById(userId);
    if (!user) throw new Error('User not found');
    
    // Get applications (Member 2)
    const applications = await this.applicationService.getApplicationsByUserId(userId);
    const approvedCount = applications.filter(app => app.status === 'APPROVED').length;
    
    // Get attended events (Member 3)
    const attendedEvents = await this.eventService.getAttendedEventsByUserId(userId);
    
    return {
      total_applications: applications.length,
      approved_applications: approvedCount,
      total_events_attended: attendedEvents.length,
      total_volunteer_hours: attendedEvents.reduce((sum, e) => sum + e.hours, 0)
    };
  }
}
```

---

## 4. Dependency Injection Setup (App-level)

**File**: `backend/src/app.js` hoặc `backend/src/server.js`

```javascript
import AuthService from './services/auth.service.js';
import EmailService from './services/email.service.js';
import UserService from './services/user.service.js';
import EventService from './services/event.service.js';
import ApplicationService from './services/application.service.js';
import AttendanceService from './services/attendance.service.js';
import CertificateService from './services/certificate.service.js';
import NotificationService from './services/notification.service.js';
import DashboardService from './services/dashboard.service.js';

// Repositories
import AuthRepository from './repositories/auth.repository.js';
import EventRepository from './repositories/event.repository.js';
// ... other repositories

// Initialize services with dependencies
const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);

const emailService = new EmailService();
const userService = new UserService(userRepository);

const eventRepository = new EventRepository();
const eventService = new EventService(eventRepository);

const applicationRepository = new ApplicationRepository();
const applicationService = new ApplicationService(
  applicationRepository,
  eventService,        // Cross-module dependency
  emailService         // Cross-module dependency
);

const attendanceRepository = new AttendanceRepository();
const attendanceService = new AttendanceService(
  attendanceRepository,
  applicationService   // Cross-module dependency
);

const certificateRepository = new CertificateRepository();
const certificateService = new CertificateService(
  certificateRepository,
  attendanceService,   // Own module
  applicationService,  // Cross-module
  emailService,        // Cross-module
  notificationService  // Cross-module
);

const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService(
  notificationRepository,
  emailService         // Cross-module dependency
);

const dashboardService = new DashboardService(
  eventService,        // Cross-module
  applicationService,  // Cross-module
  userService          // Cross-module
);

// Export for controllers
export {
  authService,
  emailService,
  userService,
  eventService,
  applicationService,
  attendanceService,
  certificateService,
  notificationService,
  dashboardService
};
```

---

## 5. Quick Reference Table

### Service Dependencies Matrix

| Service | Owner | Depends On (Cross-Module) |
|---------|-------|---------------------------|
| **AuthService** | Member 1 | - |
| **EmailService** | Member 1 | - |
| **UserService** | Member 1 | - |
| **ApplicationService** | Member 2 | EventService (M3), EmailService (M1) |
| **FeedbackService** | Member 2 | - |
| **EventService** | Member 3 | - |
| **AttendanceService** | Member 3 | ApplicationService (M2) |
| **CertificateService** | Member 3 | AttendanceService (own), ApplicationService (M2), EmailService (M1), NotificationService (M5) |
| **UserManagementService** | Member 4 | EventService (M3), ApplicationService (M2) |
| **CategoryService** | Member 4 | - |
| **SkillService** | Member 4 | - |
| **OrganizationService** | Member 5 | - |
| **NotificationService** | Member 5 | EmailService (M1) |
| **DashboardService** | Member 5 | EventService (M3), ApplicationService (M2), UserService (M1) |
| **PaymentService** | Member 5 | EmailService (M1) |

### Middleware Usage Matrix

| Middleware | Owner | Used By All? | Notes |
|------------|-------|--------------|-------|
| `authenticate` | Member 1 | ✅ Yes | All protected routes |
| `authorize(roles)` | Member 1 | ✅ Yes | Role-based access control |
| `validate(schema)` | Shared | ✅ Yes | Each member provides own schemas |
| `errorHandler` | Shared | ✅ Yes | Global error handler |
| `logger` | Shared | ✅ Yes | Request/response logging |

---

## 6. Rules for Cross-Module Communication

### ✅ DO

1. **Use Dependency Injection**: Inject dependencies via constructor
2. **Call Service methods**: Always use public service contracts
3. **Handle errors**: Wrap cross-module calls in try-catch
4. **Document contracts**: Update this file when adding new public methods
5. **Version APIs**: Use semantic versioning for breaking changes

### ❌ DON'T

1. **Direct Repository calls**: NEVER import another module's repository
2. **HTTP fetch()**: NEVER use fetch/axios for internal backend-to-backend calls
3. **Tight coupling**: Don't expose internal implementation details
4. **Circular dependencies**: Design to avoid circular service dependencies
5. **Bypass middleware**: Don't skip authentication/authorization for cross-module calls

---

**Version History**:

- v1.0 (2026-06-28): Initial version - Cross-module dependencies for 5 members
