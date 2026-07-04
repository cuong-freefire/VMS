/**
 * OTP Utility Functions - OTP generation, hashing, and verification
 * Owner: Member 1 (CuongLH)
 * 
 * Responsibilities:
 * - Generate 6-digit OTP using cryptographic randomness
 * - Hash OTP using bcryptjs (10 rounds) before storage
 * - Verify OTP by comparing plaintext with bcrypt hash
 * 
 * Security Notes:
 * - OTP is generated with crypto.randomInt for cryptographic strength
 * - OTP is never logged in plaintext
 * - Hashing uses bcryptjs with 10 rounds (faster than password hashing)
 * - Comparison uses bcrypt.compare for timing-attack resistance
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP string (e.g., "123456")
 */
export const generateOTP = () => {
    const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    return otp;
};

/**
 * Hash OTP using bcryptjs (10 rounds for faster verification)
 * @param {string} otp - Plain text OTP to hash
 * @returns {Promise<string>} Bcrypt hash of OTP
 * @throws {Error} If hashing fails
 */
export const hashOTP = async (otp) => {
    const BCRYPT_SALT_ROUNDS = 10;
    try {
        const hash = await bcrypt.hash(otp, BCRYPT_SALT_ROUNDS);
        return hash;
    } catch (error) {
        throw new Error(`Failed to hash OTP: ${error.message}`);
    }
};

/**
 * Verify OTP by comparing plaintext with bcrypt hash
 * @param {string} otp - Plain text OTP to verify
 * @param {string} otpHash - Bcrypt hash stored in database
 * @returns {Promise<boolean>} True if OTP matches hash, false otherwise
 * @throws {Error} If verification fails
 */
export const verifyOTP = async (otp, otpHash) => {
    try {
        const isValid = await bcrypt.compare(otp, otpHash);
        return isValid;
    } catch (error) {
        throw new Error(`Failed to verify OTP: ${error.message}`);
    }
};

export default {
    generateOTP,
    hashOTP,
    verifyOTP,
};
