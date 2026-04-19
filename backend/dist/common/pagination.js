"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePage = normalizePage;
exports.normalizeLimit = normalizeLimit;
function normalizePage(page) {
    return Math.max(parseInt(page ?? '0', 10) || 0, 0);
}
function normalizeLimit(limit, defaultLimit = 10, minLimit = 10, maxLimit = 100) {
    const parsed = parseInt(limit ?? '', 10);
    const value = Number.isNaN(parsed) ? defaultLimit : parsed;
    return Math.min(Math.max(value, minLimit), maxLimit);
}
//# sourceMappingURL=pagination.js.map