// src/lib/tokens.ts
import { randomBytes } from 'crypto';
import { promisify } from 'util';

const randomBytesAsync = promisify(randomBytes);

export const generateToken = async (length: number = 32): Promise<string> => {
  const buffer = await randomBytesAsync(length);
  return buffer.toString('hex');
};