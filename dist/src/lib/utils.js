"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelativeCloudinaryPath = void 0;
exports.cn = cn;
exports.calculateAge = calculateAge;
exports.getInitials = getInitials;
// src/lib/utils.ts
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
function calculateAge(birthDate) {
    if (!birthDate)
        return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    // If not had birthday this year yet, subtract one year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}
/**
 * Creates initials from a full name.
 * @param fullName - The full name string (e.g., "Yisrael Israeli").
 * @returns A string with the initials (e.g., "YI").
 */
function getInitials(fullName) {
    if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
        return 'ש'; // Default initial for "שדכן" or anonymous
    }
    const nameParts = fullName.trim().split(/\s+/); // Split by one or more spaces
    if (nameParts.length === 1) {
        // If only one name part, take the first one or two letters
        return nameParts[0].length > 1
            ? nameParts[0].substring(0, 2).toUpperCase()
            : nameParts[0].charAt(0).toUpperCase();
    }
    // Take the first letter of the first part and the first letter of the last part
    const firstInitial = nameParts[0].charAt(0);
    const lastInitial = nameParts[nameParts.length - 1].charAt(0);
    return `${firstInitial}${lastInitial}`.toUpperCase();
}
// --- START OF NEW CODE ---
// ===================================================================
// זו הפונקציה החדשה שהוספנו כדי לתקן את נתיבי התמונות
// ===================================================================
/**
 * מקבלת כתובת URL מלאה של תמונה מ-Cloudinary ומחזירה
 * את הנתיב היחסי שהרכיב Image של Next.js צריך.
 * @param fullUrl - הכתובת המלאה של התמונה.
 * @returns הנתיב היחסי, לדוגמה: /v12345/profile-images/image.jpg
 */
// בקובץ src/lib/utils.ts
const getRelativeCloudinaryPath = (fullUrl) => {
    if (!fullUrl) {
        return '';
    }
    const basePath = 'https://res.cloudinary.com/dmfxoi6g0/image/upload/';
    if (fullUrl.startsWith(basePath)) {
        // ודא שההחלפה היא עם לוכסן בהתחלה
        return fullUrl.replace(basePath, '/');
    }
    return fullUrl;
};
exports.getRelativeCloudinaryPath = getRelativeCloudinaryPath;
// --- END OF NEW CODE ---
