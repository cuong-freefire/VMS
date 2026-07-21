import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================================================
// Shared password hash – precomputed once for all users
// ============================================================================
const SEED_USER_PW = process.env.SEED_USER_PW;
let sharedHash;

// ============================================================================
// Helper: offset a date by days / hours / minutes
// ============================================================================
const daysFromNow = (n) => new Date(Date.now() + n * 86_400_000);
const hoursFromNow = (h) => new Date(Date.now() + h * 3_600_000);
const minsFromNow = (m) => new Date(Date.now() + m * 60_000);
const date = (iso) => new Date(iso); // shortcut for fixed dates

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('🔑 Computing shared password hash (bcrypt, 12 rounds)...');
  sharedHash = await bcrypt.hash(SEED_USER_PW, 12);

  // --------------------------------------------------------------------------
  // 1. ROLES
  // --------------------------------------------------------------------------
  console.log('📌 Seeding roles...');
  const rolesData = [
    { name: 'VOLUNTEER', description: 'Tình nguyện viên – tham gia sự kiện' },
    { name: 'STAFF',     description: 'Nhân viên – tạo và quản lý sự kiện, xét duyệt đơn' },
    { name: 'MANAGER',   description: 'Quản lý – duyệt sự kiện, quản lý danh mục & kỹ năng' },
    { name: 'ADMIN',     description: 'Quản trị viên – quản lý người dùng và phân quyền' },
  ];
  const roles = {};
  for (const r of rolesData) {
    roles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }
  console.log(`   ✅ ${Object.keys(roles).length} roles seeded`);

  // --------------------------------------------------------------------------
  // 2. USERS  (22 records – đủ 4 role, có chưa-verify, bị khóa)
  // --------------------------------------------------------------------------
  console.log('📌 Seeding users...');
  const usersData = [
    // --- ADMIN (2) ---
    { email: 'admin@vms.com',           fullName: 'Nguyễn Hệ Thống',      role: 'ADMIN',     phone: '0901000001' },
    { email: 'admin2@vms.com',          fullName: 'Trần Admin',           role: 'ADMIN',     phone: '0901000002' },
    // --- MANAGER (3) ---
    { email: 'manager@vms.com',         fullName: 'Lê Văn Quản',          role: 'MANAGER',   phone: '0902000001' },
    { email: 'manager.nguyen@vms.com',  fullName: 'Nguyễn Thị Quản Lý',   role: 'MANAGER',   phone: '0902000002' },
    { email: 'manager.tran@vms.com',    fullName: 'Trần Quản Trị',        role: 'MANAGER',   phone: '0902000003' },
    // --- STAFF (5) ---
    { email: 'staff@vms.com',           fullName: 'Phạm Nhân Viên',       role: 'STAFF',     phone: '0903000001' },
    { email: 'staff.minh@vms.com',      fullName: 'Lê Văn Minh',          role: 'STAFF',     phone: '0903000002' },
    { email: 'staff.thao@vms.com',      fullName: 'Phạm Thị Thảo',        role: 'STAFF',     phone: '0903000003' },
    { email: 'staff.hai@vms.com',       fullName: 'Đỗ Văn Hải',           role: 'STAFF',     phone: '0903000004' },
    { email: 'staff.linh@vms.com',      fullName: 'Hoàng Thùy Linh',      role: 'STAFF',     phone: '0903000005' },
    // --- VOLUNTEER (12 active + 1 inactive + 1 unverified) ---
    { email: 'volunteer.an@vms.com',    fullName: 'Nguyễn Văn An',        role: 'VOLUNTEER', phone: '0904000001' },
    { email: 'volunteer.binh@vms.com',  fullName: 'Trần Văn Bình',        role: 'VOLUNTEER', phone: '0904000002' },
    { email: 'volunteer.cuc@vms.com',   fullName: 'Lê Thị Cúc',           role: 'VOLUNTEER', phone: '0904000003' },
    { email: 'volunteer.dung@vms.com',  fullName: 'Phạm Văn Dũng',        role: 'VOLUNTEER', phone: '0904000004' },
    { email: 'volunteer.em@vms.com',    fullName: 'Hoàng Thị Em',         role: 'VOLUNTEER', phone: '0904000005' },
    { email: 'volunteer.phuc@vms.com',  fullName: 'Võ Văn Phúc',          role: 'VOLUNTEER', phone: '0904000006' },
    { email: 'volunteer.hanh@vms.com',  fullName: 'Đặng Thị Hạnh',        role: 'VOLUNTEER', phone: '0904000007' },
    { email: 'volunteer.hoa@vms.com',   fullName: 'Bùi Thị Hoa',          role: 'VOLUNTEER', phone: '0904000008' },
    { email: 'volunteer.khoa@vms.com',  fullName: 'Ngô Văn Khoa',         role: 'VOLUNTEER', phone: '0904000009' },
    { email: 'volunteer.lan@vms.com',   fullName: 'Mai Thị Lan',          role: 'VOLUNTEER', phone: '0904000010' },
    { email: 'volunteer.minh@vms.com',  fullName: 'Lý Văn Minh',          role: 'VOLUNTEER', phone: '0904000011' },
    { email: 'volunteer.ngoc@vms.com',  fullName: 'Đỗ Thị Ngọc',          role: 'VOLUNTEER', phone: '0904000012' },
    // Edge cases
    { email: 'volunteer.inactive@vms.com',   fullName: 'Tài Khoản Khóa',    role: 'VOLUNTEER', phone: '0904000098', isActive: false },
    { email: 'volunteer.unverified@vms.com',  fullName: 'Chưa Xác Thực',     role: 'VOLUNTEER', phone: '0904000099', emailVerified: false },
  ];

  const users = {};
  for (const u of usersData) {
    users[u.email] = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash: sharedHash,
        fullName: u.fullName,
        phone: u.phone,
        roleId: roles[u.role].id,
        isActive: u.isActive ?? true,
        emailVerified: u.emailVerified ?? true,
      },
      create: {
        email: u.email,
        passwordHash: sharedHash,
        fullName: u.fullName,
        phone: u.phone,
        roleId: roles[u.role].id,
        isActive: u.isActive ?? true,
        emailVerified: u.emailVerified ?? true,
      },
    });
  }
  console.log(`   ✅ ${Object.keys(users).length} users seeded`);

  // --------------------------------------------------------------------------
  // 3. USER SESSIONS  (5 active sessions)
  // --------------------------------------------------------------------------
  console.log('📌 Seeding user_sessions...');
  const sessionData = [
    { email: 'admin@vms.com',          jti: 'jti-admin-001',        expiresAt: daysFromNow(7) },
    { email: 'staff.minh@vms.com',     jti: 'jti-staff-minh-001',   expiresAt: daysFromNow(3) },
    { email: 'volunteer.an@vms.com',   jti: 'jti-vol-an-001',       expiresAt: daysFromNow(1) },
    { email: 'volunteer.binh@vms.com', jti: 'jti-vol-binh-001',     expiresAt: hoursFromNow(2) },
    { email: 'manager@vms.com',        jti: 'jti-mgr-001',          expiresAt: daysFromNow(5) },
  ];
  for (const s of sessionData) {
    await prisma.userSession.upsert({
      where: { userId: users[s.email].id },
      update: { jti: s.jti, expiresAt: s.expiresAt },
      create: { userId: users[s.email].id, jti: s.jti, expiresAt: s.expiresAt },
    });
  }
  console.log(`   ✅ ${sessionData.length} user_sessions seeded`);

  // --------------------------------------------------------------------------
  // 4. LOGIN ATTEMPTS  (3 scenarios)
  // --------------------------------------------------------------------------
  console.log('📌 Seeding login_attempts...');
  const loginAttemptsData = [
    { email: 'hacker@unknown.com',        attempts: 5, lockedUntil: minsFromNow(25) },         // locked
    { email: 'volunteer.inactive@vms.com', attempts: 3, lockedUntil: null },                   // near lockout
    { email: 'test.failed@vms.com',       attempts: 1, lockedUntil: null },                   // normal
  ];
  for (const la of loginAttemptsData) {
    await prisma.loginAttempt.upsert({
      where: { email: la.email },
      update: { attempts: la.attempts, lockedUntil: la.lockedUntil },
      create: { email: la.email, attempts: la.attempts, lockedUntil: la.lockedUntil },
    });
  }
  console.log(`   ✅ ${loginAttemptsData.length} login_attempts seeded`);

  // --------------------------------------------------------------------------
  // 5. EMAIL VERIFICATIONS  (4 records – REGISTER & RESET_PASSWORD)
  // --------------------------------------------------------------------------
  console.log('📌 Seeding email_verifications...');
  const otpHash = await bcrypt.hash('123456', 10);
  const emailVerificationsData = [
    {
      email: 'volunteer.unverified@vms.com', otpHash, type: 'REGISTER',
      attempts: 0, isLocked: false, lockedUntil: null,
      lastSentAt: new Date(),
    },
    {
      email: 'volunteer.an@vms.com', otpHash, type: 'REGISTER',
      attempts: 2, isLocked: false, lockedUntil: null,
      lastSentAt: minsFromNow(-2),
      createdAt: minsFromNow(-8),  // still valid (<10 min ago)
    },
    {
      email: 'staff@vms.com', otpHash, type: 'RESET_PASSWORD',
      attempts: 1, isLocked: false, lockedUntil: null,
      lastSentAt: minsFromNow(-3),
    },
    {
      email: 'volunteer.binh@vms.com', otpHash, type: 'RESET_PASSWORD',
      attempts: 4, isLocked: true, lockedUntil: minsFromNow(14),
      lastSentAt: minsFromNow(-5),
    },
  ];
  for (const ev of emailVerificationsData) {
    const createData = {
      email: ev.email, otpHash: ev.otpHash, type: ev.type,
      attempts: ev.attempts, isLocked: ev.isLocked, lockedUntil: ev.lockedUntil,
      lastSentAt: ev.lastSentAt,
    };
    if (ev.createdAt) createData.createdAt = ev.createdAt;
    await prisma.emailVerification.upsert({
      where: { email_type: { email: ev.email, type: ev.type } },
      update: createData,
      create: createData,
    });
  }
  console.log(`   ✅ ${emailVerificationsData.length} email_verifications seeded`);

  // --------------------------------------------------------------------------
  // 6. SKILLS  (12 skills, 2 soft-deleted)
  // --------------------------------------------------------------------------
  console.log('📌 Seeding skills...');
  const skillsRaw = [
    { name: 'Tiếng Anh giao tiếp',           description: 'Khả năng giao tiếp bằng tiếng Anh cơ bản đến nâng cao' },
    { name: 'Sơ cứu y tế',                   description: 'Kỹ năng sơ cứu cơ bản, CPR, băng bó vết thương' },
    { name: 'Dọn dẹp môi trường',            description: 'Thu gom rác, phân loại rác thải, trồng cây xanh' },
    { name: 'Dạy học / Gia sư',              description: 'Kỹ năng giảng dạy, kèm cặp trẻ em và người lớn' },
    { name: 'Công nghệ thông tin',           description: 'Sửa chữa máy tính, lập trình, hỗ trợ kỹ thuật' },
    { name: 'Nấu ăn / Hậu cần',              description: 'Chuẩn bị suất ăn, hậu cần sự kiện từ thiện' },
    { name: 'Truyền thông / Viết bài',       description: 'Viết bài PR, chụp ảnh, quay video, quản lý fanpage' },
    { name: 'Lái xe / Vận chuyển',           description: 'Có bằng lái, hỗ trợ vận chuyển hàng hóa và con người' },
    { name: 'Tư vấn tâm lý',                 description: 'Lắng nghe và hỗ trợ tinh thần cho người cần giúp đỡ' },
    { name: 'Xây dựng / Sửa chữa',           description: 'Sửa nhà, xây cầu đường, công trình cộng đồng nhỏ' },
    { name: 'Kỹ năng xóa mù chữ (inactive)', description: 'Dạy chữ cho người lớn tuổi – tạm dừng', isActive: false },
    { name: 'Lặn biển cứu hộ (inactive)',   description: 'Kỹ năng lặn chuyên nghiệp – tạm dừng', isActive: false },
  ];
  const skills = {};
  for (const sk of skillsRaw) {
    skills[sk.name] = await prisma.skill.upsert({
      where: { name: sk.name },
      update: { description: sk.description, isActive: sk.isActive ?? true },
      create: { name: sk.name, description: sk.description, isActive: sk.isActive ?? true },
    });
  }
  console.log(`   ✅ ${Object.keys(skills).length} skills seeded`);

  // --------------------------------------------------------------------------
  // 7. USER SKILLS  (~42 rows – each volunteer gets 2-5 skills)
  // --------------------------------------------------------------------------
  console.log('📌 Seeding user_skills...');
  const userSkillMap = {
    'volunteer.an@vms.com':   ['Tiếng Anh giao tiếp', 'Công nghệ thông tin', 'Truyền thông / Viết bài'],
    'volunteer.binh@vms.com': ['Sơ cứu y tế', 'Lái xe / Vận chuyển', 'Nấu ăn / Hậu cần'],
    'volunteer.cuc@vms.com':  ['Dạy học / Gia sư', 'Tư vấn tâm lý', 'Tiếng Anh giao tiếp'],
    'volunteer.dung@vms.com': ['Dọn dẹp môi trường', 'Xây dựng / Sửa chữa', 'Lái xe / Vận chuyển'],
    'volunteer.em@vms.com':   ['Nấu ăn / Hậu cần', 'Dạy học / Gia sư', 'Truyền thông / Viết bài', 'Tư vấn tâm lý'],
    'volunteer.phuc@vms.com': ['Công nghệ thông tin', 'Tiếng Anh giao tiếp', 'Lái xe / Vận chuyển'],
    'volunteer.hanh@vms.com': ['Tư vấn tâm lý', 'Dạy học / Gia sư', 'Nấu ăn / Hậu cần'],
    'volunteer.hoa@vms.com':  ['Truyền thông / Viết bài', 'Tiếng Anh giao tiếp', 'Công nghệ thông tin', 'Sơ cứu y tế'],
    'volunteer.khoa@vms.com': ['Xây dựng / Sửa chữa', 'Dọn dẹp môi trường', 'Lái xe / Vận chuyển', 'Nấu ăn / Hậu cần'],
    'volunteer.lan@vms.com':  ['Dạy học / Gia sư', 'Sơ cứu y tế', 'Tiếng Anh giao tiếp', 'Truyền thông / Viết bài'],
    'volunteer.minh@vms.com': ['Công nghệ thông tin', 'Dọn dẹp môi trường', 'Xây dựng / Sửa chữa'],
    'volunteer.ngoc@vms.com': ['Sơ cứu y tế', 'Tư vấn tâm lý', 'Dạy học / Gia sư', 'Nấu ăn / Hậu cần', 'Tiếng Anh giao tiếp'],
  };

  let userSkillCount = 0;
  for (const [email, skillList] of Object.entries(userSkillMap)) {
    for (const skillName of skillList) {
      await prisma.userSkill.upsert({
        where: { userId_skillId: { userId: users[email].id, skillId: skills[skillName].id } },
        update: {},
        create: { userId: users[email].id, skillId: skills[skillName].id },
      });
      userSkillCount++;
    }
  }
  console.log(`   ✅ ${userSkillCount} user_skills seeded`);

  // --------------------------------------------------------------------------
  // 8. EVENT CATEGORIES  (9 categories: 3 LOCATION, 3 TIME, 3 TYPE)
  // --------------------------------------------------------------------------
  console.log('📌 Seeding event_categories...');
  const categoriesRaw = [
    // LOCATION
    { name: 'TP. Hồ Chí Minh',  categoryType: 'LOCATION', description: 'Các sự kiện tại khu vực TP.HCM và vùng lân cận' },
    { name: 'Hà Nội',           categoryType: 'LOCATION', description: 'Các sự kiện tại khu vực Hà Nội và vùng lân cận' },
    { name: 'Đà Nẵng',          categoryType: 'LOCATION', description: 'Các sự kiện tại khu vực Đà Nẵng và miền Trung' },
    // TIME
    { name: 'Buổi sáng',        categoryType: 'TIME', description: 'Sự kiện diễn ra buổi sáng (6:00 – 12:00)' },
    { name: 'Buổi chiều',       categoryType: 'TIME', description: 'Sự kiện diễn ra buổi chiều (12:00 – 18:00)' },
    { name: 'Cả ngày',          categoryType: 'TIME', description: 'Sự kiện kéo dài cả ngày hoặc nhiều ngày' },
    // TYPE
    { name: 'Bảo vệ môi trường', categoryType: 'TYPE', description: 'Dọn rác, trồng cây, tuyên truyền bảo vệ môi trường' },
    { name: 'Giáo dục & Trẻ em', categoryType: 'TYPE', description: 'Dạy học, tổ chức hoạt động cho trẻ em' },
    { name: 'Y tế & Sức khỏe',   categoryType: 'TYPE', description: 'Khám bệnh miễn phí, hiến máu, tuyên truyền sức khỏe' },
  ];
  const categories = {};
  for (const cat of categoriesRaw) {
    const key = `${cat.categoryType}:${cat.name}`;
    categories[key] = await prisma.eventCategory.upsert({
      where: { name_categoryType: { name: cat.name, categoryType: cat.categoryType } },
      update: { description: cat.description },
      create: cat,
    });
  }
  console.log(`   ✅ ${Object.keys(categories).length} event_categories seeded`);

  // --------------------------------------------------------------------------
  // 9. EVENTS  (18 events – đủ 7 trạng thái, spread quá khứ/hiện tại/tương lai)
  // --------------------------------------------------------------------------
  console.log('📌 Seeding events...');
  const staffIds = [
    users['staff@vms.com'].id,
    users['staff.minh@vms.com'].id,
    users['staff.thao@vms.com'].id,
    users['staff.hai@vms.com'].id,
    users['staff.linh@vms.com'].id,
  ];
  const managerIds = [
    users['manager@vms.com'].id,
    users['manager.nguyen@vms.com'].id,
    users['manager.tran@vms.com'].id,
  ];

  const eventsRaw = [
    // --- DRAFT (staff đang soạn) -------------------------------------------------
    {
      title: 'Chạy bộ gây quỹ "Sắc Xanh" – Draft',
      description: 'Sự kiện chạy bộ gây quỹ trồng cây xanh tại TP.HCM. Đang được soạn thảo, dự kiến tổ chức vào cuối tháng.',
      location: 'Công viên 30/4, Quận 1, TP.HCM',
      startDate: daysFromNow(60), endDate: daysFromNow(60),
      applicationDeadline: daysFromNow(50),
      maxCapacity: 300, status: 'DRAFT',
      categoryKey: 'TYPE:Bảo vệ môi trường',
      createdBy: staffIds[0],
    },
    {
      title: 'Hội chợ Từ thiện Trung Thu – Draft',
      description: 'Tổ chức hội chợ gây quỹ tặng quà trẻ em vùng cao dịp Trung Thu. Đang hoàn thiện kế hoạch tổ chức.',
      location: 'Nhà văn hóa Thanh niên, TP.HCM',
      startDate: daysFromNow(80), endDate: daysFromNow(81),
      applicationDeadline: daysFromNow(70),
      maxCapacity: 150, status: 'DRAFT',
      categoryKey: 'TYPE:Giáo dục & Trẻ em',
      createdBy: staffIds[1],
    },

    // --- PENDING_APPROVAL (staff gửi lên, chờ manager duyệt) ------------------------
    {
      title: 'Dọn rác bãi biển Vũng Tàu',
      description: 'Chiến dịch dọn rác bãi biển, kêu gọi 200 tình nguyện viên tham gia làm sạch bờ biển Vũng Tàu.',
      location: 'Bãi Sau, Vũng Tàu',
      startDate: daysFromNow(45), endDate: daysFromNow(46),
      applicationDeadline: daysFromNow(35),
      maxCapacity: 200, status: 'PENDING_APPROVAL',
      categoryKey: 'LOCATION:TP. Hồ Chí Minh',
      createdBy: staffIds[2],
    },
    {
      title: 'Khám bệnh miễn phí Hà Nội',
      description: 'Chương trình khám bệnh, phát thuốc miễn phí cho người già neo đơn tại quận Đống Đa.',
      location: 'Trung tâm Y tế quận Đống Đa, Hà Nội',
      startDate: daysFromNow(55), endDate: daysFromNow(56),
      applicationDeadline: daysFromNow(45),
      maxCapacity: 80, status: 'PENDING_APPROVAL',
      categoryKey: 'LOCATION:Hà Nội',
      createdBy: staffIds[3],
    },

    // --- PUBLISHED (đã duyệt, đang mở đơn) ------------------------------------------
    {
      title: 'Trồng cây phủ xanh Cần Giờ',
      description: 'Trồng 5000 cây đước tại khu dự trữ sinh quyển Cần Giờ. Bao gồm ăn trưa và nước uống cho tình nguyện viên.',
      location: 'Khu dự trữ sinh quyển Cần Giờ, TP.HCM',
      startDate: daysFromNow(30), endDate: daysFromNow(30),
      applicationDeadline: daysFromNow(20),
      maxCapacity: 250, status: 'PUBLISHED',
      categoryKey: 'TYPE:Bảo vệ môi trường',
      createdBy: staffIds[0], approvedBy: managerIds[0], approvedAt: daysFromNow(-5),
    },
    {
      title: 'Mùa hè yêu thương – Dạy học tình nguyện',
      description: 'Dạy học hè cho trẻ em mái ấm, nhà mở tại TP.HCM trong 2 tuần. Cần tình nguyện viên có kỹ năng sư phạm.',
      location: 'Mái ấm Hoa Hồng, Gò Vấp, TP.HCM',
      startDate: daysFromNow(25), endDate: daysFromNow(39),
      applicationDeadline: daysFromNow(15),
      maxCapacity: 60, status: 'PUBLISHED',
      categoryKey: 'TYPE:Giáo dục & Trẻ em',
      createdBy: staffIds[1], approvedBy: managerIds[1], approvedAt: daysFromNow(-3),
    },
    {
      title: 'Hiến máu nhân đạo Đà Nẵng 2026',
      description: 'Ngày hội hiến máu tại Đà Nẵng – mỗi giọt máu cho đi, một cuộc đời ở lại. Cần tình nguyện viên hỗ trợ tổ chức.',
      location: 'Bệnh viện Đà Nẵng, TP. Đà Nẵng',
      startDate: daysFromNow(14), endDate: daysFromNow(14),
      applicationDeadline: daysFromNow(7),
      maxCapacity: 120, status: 'PUBLISHED',
      categoryKey: 'TYPE:Y tế & Sức khỏe',
      createdBy: staffIds[2], approvedBy: managerIds[2], approvedAt: daysFromNow(-10),
    },
    {
      title: 'Hỗ trợ dân vùng lũ miền Trung',
      description: 'Cứu trợ lương thực, nước uống, quần áo cho đồng bào vùng lũ miền Trung. Cần tình nguyện viên có sức khỏe tốt.',
      location: 'Huyện Hương Khê, Hà Tĩnh',
      startDate: daysFromNow(10), endDate: daysFromNow(12),
      applicationDeadline: daysFromNow(5),
      maxCapacity: 100, status: 'PUBLISHED',
      categoryKey: 'TIME:Cả ngày',
      createdBy: staffIds[3], approvedBy: managerIds[0], approvedAt: daysFromNow(-8),
    },
    // PUBLISHED – near application deadline
    {
      title: 'Tổ chức Trung Thu cho em – Hà Nội',
      description: 'Tổ chức vui Trung Thu, tặng lồng đèn và bánh cho 500 trẻ em có hoàn cảnh khó khăn tại Hà Nội.',
      location: 'Làng trẻ SOS, Gia Lâm, Hà Nội',
      startDate: daysFromNow(21), endDate: daysFromNow(21),
      applicationDeadline: daysFromNow(2),   // sắp hết hạn đăng ký!
      maxCapacity: 70, status: 'PUBLISHED',
      categoryKey: 'TYPE:Giáo dục & Trẻ em',
      createdBy: staffIds[4], approvedBy: managerIds[1], approvedAt: daysFromNow(-12),
    },
    // PUBLISHED – đã đầy (full capacity edge case)
    {
      title: 'Lớp học tiếng Anh miễn phí Quận 7',
      description: 'Dạy tiếng Anh giao tiếp miễn phí cho học sinh có hoàn cảnh khó khăn tại Quận 7. Sự kiện đã gần đầy chỗ.',
      location: 'Trung tâm học tập cộng đồng, Quận 7, TP.HCM',
      startDate: daysFromNow(8), endDate: daysFromNow(8),
      applicationDeadline: daysFromNow(3),
      maxCapacity: 30, approvedParticipants: 28, status: 'PUBLISHED',
      categoryKey: 'TYPE:Giáo dục & Trẻ em',
      createdBy: staffIds[0], approvedBy: managerIds[2], approvedAt: daysFromNow(-15),
    },

    // --- REJECTED ------------------------------------------------------------------
    {
      title: 'Phát cơm từ thiện (đã từ chối)',
      description: 'Sự kiện phát cơm từ thiện bị từ chối vì thiếu thông tin an toàn thực phẩm.',
      location: 'Chợ Bến Thành, Quận 1, TP.HCM',
      startDate: daysFromNow(90), endDate: daysFromNow(90),
      applicationDeadline: daysFromNow(80),
      maxCapacity: 50, status: 'REJECTED',
      categoryKey: 'TIME:Buổi sáng',
      createdBy: staffIds[0], approvedBy: managerIds[0], approvedAt: daysFromNow(-15),
      rejectedReason: 'Thiếu giấy chứng nhận an toàn vệ sinh thực phẩm từ đơn vị cung cấp suất ăn.',
    },

    // --- IN_PROGRESS (đang diễn ra) ------------------------------------------------
    {
      title: 'Vệ sinh kênh Nhiêu Lộc',
      description: 'Dọn rác và vớt lục bình trên kênh Nhiêu Lộc – Thị Nghè. Sự kiện đang trong giai đoạn triển khai.',
      location: 'Kênh Nhiêu Lộc, Quận 3, TP.HCM',
      startDate: daysFromNow(-1), endDate: daysFromNow(3),
      applicationDeadline: daysFromNow(-7),
      maxCapacity: 100, approvedParticipants: 65,
      status: 'IN_PROGRESS',
      categoryKey: 'TYPE:Bảo vệ môi trường',
      createdBy: staffIds[1], approvedBy: managerIds[0], approvedAt: daysFromNow(-20),
    },

    // --- COMPLETED (đã kết thúc thành công) ----------------------------------------
    {
      title: 'Tết trồng cây Xuân 2026',
      description: 'Sự kiện trồng cây đầu năm – đã hoàn thành tốt đẹp với 300 tình nguyện viên tham gia trồng hơn 10,000 cây xanh.',
      location: 'Đồi Tức Dụp, An Giang',
      startDate: date('2026-01-15T07:00:00Z'), endDate: date('2026-01-16T17:00:00Z'),
      applicationDeadline: date('2026-01-05T23:59:00Z'),
      maxCapacity: 300, approvedParticipants: 280,
      status: 'COMPLETED',
      categoryKey: 'TYPE:Bảo vệ môi trường',
      createdBy: staffIds[0], approvedBy: managerIds[0], approvedAt: date('2026-01-01T08:00:00Z'),
    },
    {
      title: 'Khám mắt miễn phí cho trẻ em',
      description: 'Khám và cấp kính miễn phí cho 500 trẻ em tại huyện Củ Chi. Phối hợp cùng Bệnh viện Mắt TP.HCM.',
      location: 'Trường tiểu học Tân Thạnh Đông, Củ Chi, TP.HCM',
      startDate: date('2026-03-10T08:00:00Z'), endDate: date('2026-03-11T16:00:00Z'),
      applicationDeadline: date('2026-02-28T23:59:00Z'),
      maxCapacity: 80, approvedParticipants: 78,
      status: 'COMPLETED',
      categoryKey: 'TYPE:Y tế & Sức khỏe',
      createdBy: staffIds[2], approvedBy: managerIds[2], approvedAt: date('2026-02-20T09:30:00Z'),
    },
    {
      title: 'Mùa hè xanh Bến Tre 2026',
      description: 'Xây cầu giao thông nông thôn và dạy học cho trẻ em tại Bến Tre. Chương trình kéo dài 2 tuần đã thành công tốt đẹp.',
      location: 'Xã An Khánh, Châu Thành, Bến Tre',
      startDate: date('2026-06-01T07:00:00Z'), endDate: date('2026-06-15T17:00:00Z'),
      applicationDeadline: date('2026-05-15T23:59:00Z'),
      maxCapacity: 120, approvedParticipants: 115,
      status: 'COMPLETED',
      categoryKey: 'TIME:Cả ngày',
      createdBy: staffIds[3], approvedBy: managerIds[1], approvedAt: date('2026-05-10T10:00:00Z'),
    },
    {
      title: 'Ngày hội văn hóa dân gian 2025',
      description: 'Tổ chức ngày hội văn hóa dân gian với các trò chơi truyền thống, ẩm thực và biểu diễn nghệ thuật.',
      location: 'Công viên Văn hóa Đầm Sen, TP.HCM',
      startDate: date('2025-11-20T08:00:00Z'), endDate: date('2025-11-20T22:00:00Z'),
      applicationDeadline: date('2025-11-10T23:59:00Z'),
      maxCapacity: 150, approvedParticipants: 145,
      status: 'COMPLETED',
      categoryKey: 'TYPE:Giáo dục & Trẻ em',
      createdBy: staffIds[4], approvedBy: managerIds[0], approvedAt: date('2025-11-01T08:00:00Z'),
    },

    // --- CANCELLED -----------------------------------------------------------------
    {
      title: 'Đạp xe vì môi trường 2026 (đã hủy)',
      description: 'Sự kiện đạp xe tuyên truyền bảo vệ môi trường – bị hủy do thời tiết xấu (bão đổ bộ).',
      location: 'Đường Hoàng Sa, TP.HCM',
      startDate: daysFromNow(-30), endDate: daysFromNow(-30),
      applicationDeadline: daysFromNow(-40),
      maxCapacity: 500, status: 'CANCELLED',
      categoryKey: 'TYPE:Bảo vệ môi trường',
      createdBy: staffIds[4], approvedBy: managerIds[0], approvedAt: daysFromNow(-50),
    },
  ];

  const events = {};
  for (const ev of eventsRaw) {
    const createData = {
      title: ev.title, description: ev.description, location: ev.location,
      startDate: ev.startDate, endDate: ev.endDate,
      applicationDeadline: ev.applicationDeadline,
      maxCapacity: ev.maxCapacity,
      approvedParticipants: ev.approvedParticipants ?? 0,
      status: ev.status,
      categoryId: categories[ev.categoryKey].id,
      createdBy: ev.createdBy,
      approvedBy: ev.approvedBy ?? null,
      approvedAt: ev.approvedAt ?? null,
      rejectedReason: ev.rejectedReason ?? null,
    };

    // Tìm event hiện có theo title (unique enough for seed)
    const existing = await prisma.event.findFirst({ where: { title: ev.title } });

    if (existing) {
      events[ev.title] = await prisma.event.update({
        where: { id: existing.id },
        data: createData,
      });
    } else {
      events[ev.title] = await prisma.event.create({ data: createData });
    }
  }
  console.log(`   ✅ ${Object.keys(events).length} events seeded`);

  // --------------------------------------------------------------------------
  // 10. APPLICATIONS  (45+ rows – đủ 4 trạng thái, nhiều event)
  // --------------------------------------------------------------------------
  console.log('📌 Seeding applications...');

  // Helper: pull volunteer users
  const volAn    = users['volunteer.an@vms.com'];
  const volBinh  = users['volunteer.binh@vms.com'];
  const volCuc   = users['volunteer.cuc@vms.com'];
  const volDung  = users['volunteer.dung@vms.com'];
  const volEm    = users['volunteer.em@vms.com'];
  const volPhuc  = users['volunteer.phuc@vms.com'];
  const volHanh  = users['volunteer.hanh@vms.com'];
  const volHoa   = users['volunteer.hoa@vms.com'];
  const volKhoa  = users['volunteer.khoa@vms.com'];
  const volLan   = users['volunteer.lan@vms.com'];
  const volMinhV = users['volunteer.minh@vms.com'];
  const volNgoc  = users['volunteer.ngoc@vms.com'];

  const staffUser = users['staff@vms.com'];
  const staffMinh = users['staff.minh@vms.com'];
  const staffThao = users['staff.thao@vms.com'];
  const staffHai  = users['staff.hai@vms.com'];
  const staffLinh = users['staff.linh@vms.com'];

  const applicationsData = [
    // === PUBLISHED events – PENDING applications ===================================
    { event: 'Trồng cây phủ xanh Cần Giờ',          user: volAn,    status: 'PENDING',   message: 'Tôi có kinh nghiệm trồng cây 2 năm. Rất mong được tham gia.' },
    { event: 'Trồng cây phủ xanh Cần Giờ',          user: volCuc,   status: 'PENDING',   message: 'Tôi yêu thiên nhiên và sẵn sàng làm việc ngoài trời.' },
    { event: 'Trồng cây phủ xanh Cần Giờ',          user: volDung,  status: 'APPROVED',  message: null },
    { event: 'Trồng cây phủ xanh Cần Giờ',          user: volKhoa,  status: 'PENDING',   message: null },
    { event: 'Trồng cây phủ xanh Cần Giờ',          user: volNgoc,  status: 'APPROVED',  message: 'Mình có kỹ năng sơ cứu, hy vọng hỗ trợ được.' },

    { event: 'Mùa hè yêu thương – Dạy học tình nguyện', user: volAn,    status: 'PENDING',   message: 'Tôi đã từng dạy tại mái ấm Hoa Hồng 3 tháng hè trước.' },
    { event: 'Mùa hè yêu thương – Dạy học tình nguyện', user: volEm,    status: 'APPROVED',  message: null },
    { event: 'Mùa hè yêu thương – Dạy học tình nguyện', user: volHanh,  status: 'PENDING',   message: 'Tôi là giáo viên tiểu học, rất phù hợp.' },
    { event: 'Mùa hè yêu thương – Dạy học tình nguyện', user: volLan,   status: 'APPROVED',  message: null },

    { event: 'Hiến máu nhân đạo Đà Nẵng 2026',      user: volBinh,  status: 'PENDING',   message: 'Tôi đã hiến máu 3 lần, sức khỏe tốt.' },
    { event: 'Hiến máu nhân đạo Đà Nẵng 2026',      user: volPhuc,  status: 'APPROVED',  message: null },
    { event: 'Hiến máu nhân đạo Đà Nẵng 2026',      user: volHoa,   status: 'PENDING',   message: null },
    { event: 'Hiến máu nhân đạo Đà Nẵng 2026',      user: volNgoc,  status: 'REJECTED',  message: 'Nhóm máu của tôi là AB-, hy vọng vẫn được tham gia.' },

    { event: 'Hỗ trợ dân vùng lũ miền Trung',         user: volKhoa,  status: 'PENDING',   message: 'Tôi có bằng lái xe và sẵn sàng vận chuyển hàng.' },
    { event: 'Hỗ trợ dân vùng lũ miền Trung',         user: volMinhV, status: 'APPROVED',  message: null },
    { event: 'Hỗ trợ dân vùng lũ miền Trung',         user: volDung,  status: 'PENDING',   message: 'Mình có kinh nghiệm cứu trợ vùng lũ từ năm ngoái.' },

    { event: 'Tổ chức Trung Thu cho em – Hà Nội',    user: volCuc,   status: 'PENDING',   message: null },
    { event: 'Tổ chức Trung Thu cho em – Hà Nội',    user: volLan,   status: 'PENDING',   message: 'Tôi có thể làm MC và tổ chức trò chơi cho trẻ em.' },
    { event: 'Tổ chức Trung Thu cho em – Hà Nội',    user: volHoa,   status: 'APPROVED',  message: 'Mình có kinh nghiệm tổ chức sự kiện thiếu nhi.' },

    { event: 'Lớp học tiếng Anh miễn phí Quận 7',    user: volAn,    status: 'APPROVED',  message: null },
    { event: 'Lớp học tiếng Anh miễn phí Quận 7',    user: volLan,   status: 'APPROVED',  message: null },
    { event: 'Lớp học tiếng Anh miễn phí Quận 7',    user: volNgoc,  status: 'APPROVED',  message: null },
    { event: 'Lớp học tiếng Anh miễn phí Quận 7',    user: volPhuc,  status: 'PENDING',   message: 'Tôi có chứng chỉ IELTS 7.0, hy vọng được đóng góp.' },

    // === PUBLISHED events – CANCELLED (volunteer tự hủy) =========================
    { event: 'Trồng cây phủ xanh Cần Giờ',          user: volHanh,  status: 'CANCELLED',  message: null },

    // === IN_PROGRESS – APPROVED (đã điểm danh ảo) =================================
    { event: 'Vệ sinh kênh Nhiêu Lộc',              user: volDung,  status: 'APPROVED',  message: null },
    { event: 'Vệ sinh kênh Nhiêu Lộc',              user: volEm,   status: 'APPROVED',  message: null },
    { event: 'Vệ sinh kênh Nhiêu Lộc',              user: volPhuc, status: 'APPROVED',  message: null },
    { event: 'Vệ sinh kênh Nhiêu Lộc',              user: volHoa,  status: 'APPROVED',  message: null },
    { event: 'Vệ sinh kênh Nhiêu Lộc',              user: volMinhV, status: 'APPROVED',  message: null },

    // === COMPLETED events – có cả PENDING, APPROVED, REJECTED ====================
    { event: 'Tết trồng cây Xuân 2026',             user: volAn,    status: 'APPROVED',  message: null },
    { event: 'Tết trồng cây Xuân 2026',             user: volBinh,  status: 'APPROVED',  message: null },
    { event: 'Tết trồng cây Xuân 2026',             user: volCuc,   status: 'APPROVED',  message: null },
    { event: 'Tết trồng cây Xuân 2026',             user: volDung,  status: 'APPROVED',  message: null },
    { event: 'Tết trồng cây Xuân 2026',             user: volEm,   status: 'REJECTED',  message: 'Đăng ký muộn hơn deadline.' },
    { event: 'Tết trồng cây Xuân 2026',             user: volPhuc, status: 'APPROVED',  message: null },
    { event: 'Tết trồng cây Xuân 2026',             user: volHanh, status: 'CANCELLED',  message: null },

    { event: 'Khám mắt miễn phí cho trẻ em',         user: volBinh,  status: 'APPROVED',  message: null },
    { event: 'Khám mắt miễn phí cho trẻ em',         user: volCuc,   status: 'APPROVED',  message: null },
    { event: 'Khám mắt miễn phí cho trẻ em',         user: volEm,   status: 'APPROVED',  message: null },

    { event: 'Mùa hè xanh Bến Tre 2026',            user: volAn,    status: 'APPROVED',  message: null },
    { event: 'Mùa hè xanh Bến Tre 2026',            user: volDung,  status: 'APPROVED',  message: null },
    { event: 'Mùa hè xanh Bến Tre 2026',            user: volEm,   status: 'APPROVED',  message: null },
    { event: 'Mùa hè xanh Bến Tre 2026',            user: volHoa,  status: 'REJECTED',  message: 'Không đáp ứng yêu cầu sức khỏe cho chuyến đi 2 tuần.' },

    { event: 'Ngày hội văn hóa dân gian 2025',      user: volBinh,  status: 'APPROVED',  message: null },
    { event: 'Ngày hội văn hóa dân gian 2025',      user: volCuc,   status: 'APPROVED',  message: null },
    { event: 'Ngày hội văn hóa dân gian 2025',      user: volHanh,  status: 'APPROVED',  message: null },
    { event: 'Ngày hội văn hóa dân gian 2025',      user: volLan,   status: 'APPROVED',  message: null },
    { event: 'Ngày hội văn hóa dân gian 2025',      user: volKhoa,  status: 'REJECTED',  message: 'Đăng ký sau khi sự kiện đã đủ chỉ tiêu.' },
  ];

  // We'll track which staff processes which application for APPROVED/REJECTED
  const staffProcessors = [staffUser, staffMinh, staffThao, staffHai, staffLinh];
  const processedMap = {}; // key: eventTitle -> count to cycle staff
  let appCount = 0;

  for (const app of applicationsData) {
    const ev = events[app.event];
    if (!ev) continue;

    const createAppData = {
      userId: app.user.id,
      eventId: ev.id,
      status: app.status,
      message: app.message ?? null,
    };

    // If APPROVED or REJECTED, assign processedBy & processedAt
    if (app.status === 'APPROVED' || app.status === 'REJECTED') {
      processedMap[app.event] = (processedMap[app.event] ?? 0) + 1;
      const staffIdx = processedMap[app.event] % staffProcessors.length;
      createAppData.processedBy = staffProcessors[staffIdx].id;
      createAppData.processedAt = ev.approvedAt
        ? new Date(ev.approvedAt.getTime() + 86_400_000) // 1 day after approval
        : daysFromNow(-1);
    }

    // Tìm application hiện có
    const existingApp = await prisma.application.findUnique({
      where: { userId_eventId: { userId: app.user.id, eventId: ev.id } },
    });

    if (existingApp) {
      await prisma.application.update({
        where: { id: existingApp.id },
        data: createAppData,
      });
    } else {
      await prisma.application.create({ data: createAppData });
    }
    appCount++;
  }
  console.log(`   ✅ ${appCount} applications seeded`);

  // --------------------------------------------------------------------------
  // 11. SYNC approved_participants on events
  // --------------------------------------------------------------------------
  console.log('📌 Syncing approved_participants...');
  for (const ev of Object.values(events)) {
    const approvedCount = await prisma.application.count({
      where: { eventId: ev.id, status: 'APPROVED' },
    });
    await prisma.event.update({
      where: { id: ev.id },
      data: { approvedParticipants: approvedCount },
    });
  }
  console.log('   ✅ approved_participants synced');

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n══════════════════════════════════════════════');
  console.log('🎉 SEED COMPLETE');
  console.log('══════════════════════════════════════════════');
  console.log(`   Roles:              ${Object.keys(roles).length}`);
  console.log(`   Users:              ${Object.keys(users).length}`);
  console.log(`   UserSessions:       ${sessionData.length}`);
  console.log(`   LoginAttempts:      ${loginAttemptsData.length}`);
  console.log(`   EmailVerifications: ${emailVerificationsData.length}`);
  console.log(`   Skills:             ${Object.keys(skills).length}`);
  console.log(`   UserSkills:         ${userSkillCount}`);
  console.log(`   EventCategories:    ${Object.keys(categories).length}`);
  console.log(`   Events:             ${Object.keys(events).length}`);
  console.log(`   Applications:       ${appCount}`);
  console.log('══════════════════════════════════════════════');
  console.log('🔑 Seed passwords set from SEED_USER_PW env var');
  console.log('══════════════════════════════════════════════\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });