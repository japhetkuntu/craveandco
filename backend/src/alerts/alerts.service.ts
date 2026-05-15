import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async createRule(data: { name: string; metric: string; operator: string; threshold: number; severity?: string }) {
    return this.prisma.alertRule.create({ data: data as any });
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

  async findAlerts(branchId: string, status?: string, page = 0, limit = 10) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    return this.prisma.alert.findMany({
      where: { branchId, ...(status && { status: status as any }) },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async acknowledgeAlert(id: string) {
    return this.prisma.alert.update({
      where: { id },
      data: { status: 'ACKNOWLEDGED' },
    });
  }

  async resolveAlert(id: string) {
    return this.prisma.alert.update({
      where: { id },
      data: { status: 'RESOLVED' },
    });
  }

  async getSummary(branchId: string) {
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
    } as any;

    statusGroups.forEach((group) => {
      summary.total += group._count._all;
      if (group.status === 'OPEN') summary.open = group._count._all;
      if (group.status === 'ACKNOWLEDGED') summary.acknowledged = group._count._all;
      if (group.status === 'RESOLVED') summary.resolved = group._count._all;
    });
    severityGroups.forEach((group) => {
      summary.bySeverity[group.severity as string] = group._count._all;
    });

    return summary;
  }

  async createAlert(branchId: string, type: string, severity: string, message: string) {
    return this.prisma.alert.create({
      data: { branchId, type, severity: severity as any, message },
    });
  }
}
