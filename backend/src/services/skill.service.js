/**
 * Skill Service - Business logic for Skill Management module
 * Owner: Member 4 - DucNM (UC34)
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
    const roleId = currentUser?.role_id;

    // Manager (3) và Admin (4) thấy tất cả skills
    // Staff (2), Volunteer (1), Guest (null) chỉ thấy active
    const showAll = roleId === MANAGER_ROLE_ID || roleId === ADMIN_ROLE_ID;

    const where = showAll ? {} : { isActive: true };

    const skills = await skillRepository.findAll(where);

    return {
        skills: skills.map(formatSkill)
    };
}

export default {
    getSkills
};