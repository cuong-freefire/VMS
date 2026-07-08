/**
 * Jest Configuration for VMS Backend (ESM Native)
 *
 * File này cấu hình Jest để chạy test trong môi trường ESM native,
 * hỗ trợ cả static import và dynamic import().
 *
 * Nguyên tắc:
 * - transform: {} — Không transform bất kỳ file .js nào.
 *   Mọi file chạy native ESM thông qua --experimental-vm-modules.
 * - extensionsToTreatAsEsm: ['.js'] — Báo cho Jest biết file .js là ESM,
 *   không phải CJS.
 * - modulePathIgnorePatterns — Giới hạn phạm vi quét module trong project,
 *   tránh quét các thư mục ngoài backend (frontend, .sdd, docs, IDE...).
 */

export default {
    // Root directory của test
    rootDir: '.',

    // KHÔNG transform file nào — chạy native ESM
    // (yêu cầu --experimental-vm-modules trong script test)
    transform: {},

  // Môi trường test: Node.js
    testEnvironment: 'node',

    // Pattern tìm test files
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.spec.js'
    ],

    // Giới hạn phạm vi quét module trong backend project
    // Ngăn Jest quét các thư mục ngoài dự án (IDE extensions, workspace root...)
    modulePathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/../frontend',
        '<rootDir>/../.sdd',
        '<rootDir>/../docs',
        '<rootDir>/../shared'
    ],

    // Watch mode: bỏ qua các thư mục không liên quan
    watchPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/../frontend',
        '<rootDir>/../.sdd',
        '<rootDir>/../docs'
    ],

    // Bỏ qua transform trong node_modules (mặc định, giữ lại để rõ ràng)
    transformIgnorePatterns: [
        '/node_modules/'
    ],

    // Module directories — chỉ tìm trong backend/node_modules
    moduleDirectories: [
        'node_modules'
    ],

    // Haste module system config
    // forceNodeFilesystemAPI: Sử dụng Node filesystem API thay vì Haste
    // để resolve module, tránh collision khi có nhiều package.json cùng tên
    haste: {
        throwOnModuleCollision: false,
        enableSymlinks: false,
        forceNodeFilesystemAPI: true
    },

    // Clear mocks giữa các test
    clearMocks: true,

    // Restore mocks sau mỗi test suite
    restoreMocks: true,

    // Timeout cho test (30 giây — đủ cho integration test có DB call)
    testTimeout: 30000,

    // Force exit sau khi test xong
    forceExit: true,

    // Detect open handles (async operations chưa đóng)
    detectOpenHandles: true
};