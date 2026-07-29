/**
 * Skill Controller - HTTP layer for Skill Management module
 * Owner: Member 4 - DucNM (UC34, UC35, UC36, UC-feat-search-skill)
 *
 * Responsibilities:
 * - Handle HTTP request/response for skill management endpoints
 * - Extract user info and pass to Service layer
 * - Return standardized API response
 *
 * Rules:
 * - Role-based visibility handled by Service layer
 * - Always use response.util.js for response format
 */

import skillService from '../services/skill.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

/**
 * GET /api/v1/skills
 * Lấy danh sách kỹ năng với role-based visibility.
 * Hỗ trợ search param (UC-feat-search-skill).
 * - Guest (không token) → chỉ active
 * - Volunteer/Staff → chỉ active
 * - Manager/Admin → tất cả (active + inactive)
 */
async function getSkillsHandler(req, res, next) {
    try {
        const query = req.validatedQuery || req.query;
        const result = await skillService.getSkills(req.user, query);

        const message = result.skills.length > 0
            ? 'Lấy danh sách kỹ năng thành công'
            : 'Không có kỹ năng nào';

        return res.status(200).json(
            successResponse(result, message)
        );
    } catch (error) {
        if (error.status && error.code) {
            return res.status(error.status).json(
                errorResponse(error.message, error.code, error.details)
            );
        }
        next(error);
    }
}

/**
 * POST /api/v1/skills
 * Tạo kỹ năng mới.
 * Chỉ Manager/Admin mới có quyền truy cập (kiểm tra ở middleware).
 */
async function createSkillHandler(req, res, next) {
    try {
        const skill = await skillService.createSkillService(req.body);

        return res.status(201).json(
            successResponse(skill, 'Tạo kỹ năng thành công')
        );
    } catch (error) {
        if (error.status && error.code) {
            return res.status(error.status).json(
                errorResponse(error.message, error.code, error.details)
            );
        }
        next(error);
    }
}

/**
 * PATCH /api/v1/skills/:id
 * Cập nhật thông tin kỹ năng.
 * Chỉ Manager/Admin mới có quyền truy cập (kiểm tra ở middleware).
 * Skill name phải unique.
 */
async function updateSkillHandler(req, res, next) {
    try {
        const skillId = req.validatedParams.id;
        const skill = await skillService.updateSkillService(skillId, req.body);

        return res.status(200).json(
            successResponse(skill, 'Cập nhật kỹ năng thành công')
        );
    } catch (error) {
        if (error.status && error.code) {
            return res.status(error.status).json(
                errorResponse(error.message, error.code, error.details)
            );
        }
        next(error);
    }
}

export {
    getSkillsHandler,
    createSkillHandler,
    updateSkillHandler
};