import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { successResponse } from "../utils/response.util.js";

const router = Router();

router.get('/me', authMiddleware, (req, res) => {
    res.status(200).json(successResponse({name: 'Đã lấy name'}, 'Get me thành công'))
})

export default router;