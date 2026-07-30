import { Router } from "express";
import { handleVnpayIpn } from "../controllers/payment.controller.js";

const router = Router();

router.get('/ipn',handleVnpayIpn)

export default router;
