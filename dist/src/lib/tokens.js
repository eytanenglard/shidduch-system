"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = void 0;
// src/lib/tokens.ts
const crypto_1 = require("crypto");
const util_1 = require("util");
const randomBytesAsync = (0, util_1.promisify)(crypto_1.randomBytes);
const generateToken = async (length = 32) => {
    const buffer = await randomBytesAsync(length);
    return buffer.toString('hex');
};
exports.generateToken = generateToken;
