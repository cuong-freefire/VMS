/**
 * Skill Service - Business logic for Skill Management module
 * Owner: Member 4 - DucNM (UC34, UC35, UC36, UC-feat-search-skill)
 *
 * Responsibilities:
 * - Get list of skills with role-based visibility
 * - Search skills by name and description (UC-feat-search-skill)
 * - Create new skill
 * - Update existing skill
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
 * Build Prisma where clause from query params
 * và query params.
 *
 * @param {boolean} showAll
 * @param {Object} query
 * @returns {Object}
 */
function buildWhereClause(showAll, query) {
    const conditions = [];

    // Role visibility
    if (!showAll) {
        conditions.push({
            isActive: true
        });
    }

    // Search
    if (query.search) {
        const keyword = query.search.trim();

        conditions.push({
            OR: [
                {
                    name: {
                        contains: keyword,
                        mode: 'insensitive'
                    }
                },
                {
                    description: {
                        contains: keyword,
                        mode: 'insensitive'
                    }
                }
            ]
        });
    }

    return conditions.length
        ? { AND: conditions }
        : {};
}

/**
 * Get skills based on user role, with optional search.
 * UC-feat-search-skill: thêm search support.
 *
 * @param {Object|null} currentUser - User from JWT (req.user) or null for Guest
 * @param {Object} [query={}] - Query params: { search }
 * @returns {Promise<Object>} { skills: Array }
 */
async function getSkills(currentUser, query = {}) {
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

    const where = buildWhereClause(showAll, query);

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

/**
 * Update skill information.
 * UC36: Edit Skill — Manager/Admin chỉnh sửa kỹ năng.
 *
 * Business Logic:
 * 1. Check skill exists → 404 nếu không tìm thấy
 * 2. If name changed, check uniqueness (exclude self) → 409 nếu trùng
 * 3. Map request fields to Prisma field names
 * 4. Update skill trong database
 * 5. Format response
 *
 * @param {number} skillId - Skill ID từ route param
 * @param {Object} data - Fields to update từ request body
 * @returns {Promise<Object>} Formatted skill object
 * @throws {ServiceError} 400/404/409 errors
 */
async function updateSkillService(skillId, data) {

    // Validate skill ID
    if (!Number.isInteger(skillId) || skillId <= 0) {
        throw new ServiceError(
            'Invalid skill id.',
            400,
            'INVALID_SKILL_ID'
        );
    }

    // 1. Check skill exists
    const existing = await skillRepository.findById(skillId);
    if (!existing) {
        throw new ServiceError(
            'Skill not found.',
            404,
            'SKILL_NOT_FOUND'
        );
    }

    const normalizedName = data.name !== undefined
        ? data.name.trim()
        : undefined;

    // 2. If name changed, check uniqueness (exclude self)
    if (normalizedName !== undefined && normalizedName !== existing.name) {
        const conflict = await skillRepository.findByNameExcluding(
            normalizedName,
            skillId
        );
        if (conflict) {
            throw new ServiceError(
                'Skill name already exists.',
                409,
                'SKILL_EXISTS'
            );
        }
    }

    // 3. Map request fields to Prisma field names
    const updateData = {};
    if (normalizedName !== undefined) {
        updateData.name = normalizedName;
    }
    if (data.description !== undefined) {
        updateData.description = data.description ?? null;
    }
    if (data.is_active !== undefined) {
        updateData.isActive = data.is_active;
    }

    // 4. Update skill trong database
    try {
        const updatedSkill = await skillRepository.updateSkill(skillId, updateData);

        // 5. Format response
        return formatSkill(updatedSkill);
    } catch (error) {
        if (error.code === 'P2002') {
            throw new ServiceError(
                'Skill name already exists.',
                409,
                'SKILL_EXISTS'
            );
        }

        throw error;
    }
}

export default {
    getSkills,
    createSkillService,
    updateSkillService
};