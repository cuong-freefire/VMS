/**
 * Skill Service - Business logic for Skill Management module
 * Owner: Member 4 - DucNM (UC34, UC35)
 *
 * Responsibilities:
 * - Get list of skills with role-based visibility
 *
 * Rules:
 * - Guest (req.user = null) → chỉ thấy active skills
 * - Volunteer → chỉ thấy active skills
 * - Staff → chỉ thấy active skills
 * - Manager/Admin → thấy tất cả (active + inactive)
 * - Pattern giống Category service (UC31)
 */

import { ServiceError } from '../utils/response.util.js';
import skillRepository from '../repositories/skill.repository.js';

const MANAGER_ROLE_ID = 3;
const ADMIN_ROLE_ID = 4;

/**
 * Format skill from Prisma format to API response format.
 *
 * @param {Object} skill - Skill from Prisma
 * @returns {Object} Formatted skill
 */
function formatSkill(skill) {
    return {
        skill_id: skill.id,
        name: skill.name,
        description: skill.description,
        is_active: skill.isActive
    };
}

/**
 * Get skills based on user role.
 * Manager/Admin → thấy tất cả (active + inactive)
 * Staff/Volunteer/Guest → chỉ thấy active
 *
 * @param {Object|null} currentUser - User from JWT (req.user) or null for Guest
 * @returns {Promise<Object>} { skills: Array }
 */
async function getSkills(currentUser) {
    let roleName = null;

    if (currentUser?.role_id) {
        roleName = await skillRepository.findRoleNameById(
            currentUser.role_id
        );
    }

    const normalizedRole = roleName?.toUpperCase();

    const showAll =
        normalizedRole === 'MANAGER' ||
        normalizedRole === 'ADMIN';

    const where = showAll ? {} : { isActive: true };

    const skills = await skillRepository.findAll(where);

    return {
        skills: skills.map(formatSkill)
    };
}

/**
 * Create a new skill.
 * UC35: Add Skill — Manager/Admin thêm kỹ năng mới.
 *
 * Business Logic:
 * 1. Check uniqueness: name không được trùng → 409 nếu đã tồn tại
 * 2. Create skill trong database
 * 3. Format response
 *
 * @param {Object} data - Skill data từ request body
 * @returns {Promise<Object>} Formatted skill object
 * @throws {ServiceError} 409 nếu tên đã tồn tại
 */
async function createSkillService(data) {
    // 1. Check uniqueness: name unique trên toàn bảng
    const existing = await skillRepository.findByName(data.name);
    if (existing) {
        throw new ServiceError(
            'Skill name already exists.',
            409,
            'SKILL_EXISTS'
        );
    }

    // 2. Create skill trong database
    const newSkill = await skillRepository.createSkill({
        name: data.name,
        description: data.description
    });

    // 3. Format response
    return formatSkill(newSkill);
}

export default {
    getSkills,
    createSkillService
};
