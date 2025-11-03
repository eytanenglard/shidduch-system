"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALIDATION_RULES = exports.CONTACT_PREFERENCE_KEYS = exports.PROFILE_SECTIONS_CONFIG = exports.PROFILE_SECTION_KEYS = exports.WORLDS_CONFIG = exports.WORLD_KEYS = void 0;
// src/components/profile/constants.ts
const lucide_react_1 = require("lucide-react");
// Keys for WORLDS, titles are now in the dictionary
exports.WORLD_KEYS = {
    values: "values",
    personality: "personality",
    relationship: "relationship",
    religion: "religion",
    partner: "partner",
};
exports.WORLDS_CONFIG = {
    [exports.WORLD_KEYS.values]: {
        icon: lucide_react_1.Heart,
        color: "text-pink-500",
        bgColor: "bg-pink-50",
        borderColor: "border-pink-200",
    },
    [exports.WORLD_KEYS.personality]: {
        icon: lucide_react_1.User,
        color: "text-blue-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
    },
    [exports.WORLD_KEYS.relationship]: {
        icon: lucide_react_1.Users,
        color: "text-purple-500",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
    },
    [exports.WORLD_KEYS.religion]: {
        icon: lucide_react_1.Scroll,
        color: "text-indigo-500",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
    },
    [exports.WORLD_KEYS.partner]: {
        icon: lucide_react_1.Heart,
        color: "text-red-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
    },
};
// Keys for PROFILE_SECTIONS, titles are in the dictionary
exports.PROFILE_SECTION_KEYS = {
    BASIC_INFO: "BASIC_INFO",
    EDUCATION: "EDUCATION",
    LOCATION: "LOCATION",
    FAMILY: "FAMILY",
    PREFERENCES: "PREFERENCES",
};
exports.PROFILE_SECTIONS_CONFIG = {
    [exports.PROFILE_SECTION_KEYS.BASIC_INFO]: { icon: lucide_react_1.User },
    [exports.PROFILE_SECTION_KEYS.EDUCATION]: { icon: lucide_react_1.GraduationCap },
    [exports.PROFILE_SECTION_KEYS.LOCATION]: { icon: lucide_react_1.MapPin },
    [exports.PROFILE_SECTION_KEYS.FAMILY]: { icon: lucide_react_1.Users },
    [exports.PROFILE_SECTION_KEYS.PREFERENCES]: { icon: lucide_react_1.Heart },
};
// Technical constants (keys or values that don't change with language)
exports.CONTACT_PREFERENCE_KEYS = {
    DIRECT: "direct",
    MATCHMAKER: "matchmaker",
    BOTH: "both",
};
// Validation rules (non-translatable)
exports.VALIDATION_RULES = {
    AGE: {
        MIN: 18,
        MAX: 99
    },
    HEIGHT: {
        MIN: 100,
        MAX: 250
    },
    NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 50
    }
};
