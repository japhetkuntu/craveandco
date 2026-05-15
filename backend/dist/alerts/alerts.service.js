"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AlertsService = class AlertsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRule(data) {
        return this.prisma.alertRule.create({ data: data });
    }
    async findRules(page = 0, limit = 10) {
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return this.prisma.alertRule.findMany({
            where: { active: true },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
        });
    }
    async findAlerts(branchId, status, page = 0, limit = 10) {
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return this.prisma.alert.findMany({
            where: { branchId, ...(status && { status: status }) },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
        });
    }
    async acknowledgeAlert(id) {
        return this.prisma.alert.update({
            where: { id },
            data: { status: 'ACKNOWLEDGED' },
        });
    }
    async resolveAlert(id) {
        return this.prisma.alert.update({
            where: { id },
            data: { status: 'RESOLVED' },
        });
    }
    async getSummary(branchId) {
        const statusGroups = await this.prisma.alert.groupBy({
            by: ['status'],
            where: { branchId },
            _count: { _all: true },
        });
        const severityGroups = await this.prisma.alert.groupBy({
            by: ['severity'],
            where: { branchId },
            _count: { _all: true },
        });
        const summary = {
            total: 0,
            open: 0,
            acknowledged: 0,
            resolved: 0,
            bySeverity: {
                INFO: 0,
                WARNING: 0,
                CRITICAL: 0,
            },
        };
        statusGroups.forEach((group) => {
            summary.total += group._count._all;
            if (group.status === 'OPEN')
                summary.open = group._count._all;
            if (group.status === 'ACKNOWLEDGED')
                summary.acknowledged = group._count._all;
            if (group.status === 'RESOLVED')
                summary.resolved = group._count._all;
        });
        severityGroups.forEach((group) => {
            summary.bySeverity[group.severity] = group._count._all;
        });
        return summary;
    }
    async createAlert(branchId, type, severity, message) {
        return this.prisma.alert.create({
            data: { branchId, type, severity: severity, message },
        });
    }
};
exports.AlertsService = AlertsService;
exports.AlertsService = AlertsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map