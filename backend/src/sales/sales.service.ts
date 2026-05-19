import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  LogAcquisitionDto,
  CreateBusinessLeadDto,
  UpdateBusinessLeadDto,
  AddInteractionDto,
  UpsertTargetDto,
} from './dto/sales.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── TARGETS ────────────────────────────────────────────

  async getTargetForDate(userId: string, date: string) {
    const record = await this.prisma.dailyAcquisitionTarget.findUnique({
      where: { userId_date: { userId, date: new Date(date) } },
    });
    return {
      individualTarget: record?.individualTarget ?? 5,
      businessTarget: record?.businessTarget ?? 2,
    };
  }

  async upsertTarget(dto: UpsertTargetDto) {
    return this.prisma.dailyAcquisitionTarget.upsert({
      where: { userId_date: { userId: dto.userId, date: new Date(dto.date) } },
      update: {
        individualTarget: dto.individualTarget,
        businessTarget: dto.businessTarget,
      },
      create: {
        user: { connect: { id: dto.userId } },
        branch: { connect: { id: (await this.prisma.user.findUnique({ where: { id: dto.userId }, select: { branchId: true } }))!.branchId } },
        date: new Date(dto.date),
        individualTarget: dto.individualTarget,
        businessTarget: dto.businessTarget,
      },
    });
  }

  async getTargetsForBranch(branchId: string, date: string) {
    const executives = await this.prisma.user.findMany({
      where: { branchId, role: 'SALES_EXECUTIVE', active: true },
      select: { id: true, name: true },
    });
    const targets = await this.prisma.dailyAcquisitionTarget.findMany({
      where: { userId: { in: executives.map((e) => e.id) }, date: new Date(date) },
    });
    const targetMap = Object.fromEntries(targets.map((t) => [t.userId, t]));
    return executives.map((exec) => ({
      userId: exec.id,
      name: exec.name,
      individualTarget: targetMap[exec.id]?.individualTarget ?? 5,
      businessTarget: targetMap[exec.id]?.businessTarget ?? 2,
    }));
  }

  // ─── DASHBOARD ───────────────────────────────────────────

  async getDashboard(executiveId: string, branchId: string, date: string) {
    const day = new Date(date);
    const target = await this.getTargetForDate(executiveId, date);

    const [individualCount, businessCount, recentLogs, followUps] = await Promise.all([
      this.prisma.acquisitionLog.count({
        where: { executiveId, date: day, type: 'INDIVIDUAL' },
      }),
      this.prisma.acquisitionLog.count({
        where: { executiveId, date: day, type: 'BUSINESS' },
      }),
      this.prisma.acquisitionLog.findMany({
        where: { executiveId, date: day },
        include: { customer: { select: { name: true, phone: true } }, businessLead: { select: { companyName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.businessLead.findMany({
        where: {
          executiveId,
          followUpDate: { lte: new Date() },
          status: { notIn: ['SIGNED', 'LOST'] },
        },
        orderBy: { followUpDate: 'asc' },
        take: 5,
      }),
    ]);

    return {
      date,
      individualCount,
      businessCount,
      individualTarget: target.individualTarget,
      businessTarget: target.businessTarget,
      recentLogs,
      followUps,
    };
  }

  // ─── ACQUISITIONS ────────────────────────────────────────

  async logAcquisition(dto: LogAcquisitionDto, executiveId: string, branchId: string) {
    let customerId: string | undefined;

    if (dto.type === 'INDIVIDUAL' && dto.customerPhone) {
      let customer = await this.prisma.customer.findFirst({
        where: { phone: dto.customerPhone },
      });
      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            name: dto.customerName ?? dto.customerPhone,
            phone: dto.customerPhone,
          },
        });
      }
      customerId = customer.id;
    }

    return this.prisma.acquisitionLog.create({
      data: {
        branch: { connect: { id: branchId } },
        executive: { connect: { id: executiveId } },
        ...(customerId ? { customer: { connect: { id: customerId } } } : {}),
        ...(dto.businessLeadId ? { businessLead: { connect: { id: dto.businessLeadId } } } : {}),
        type: dto.type,
        source: dto.source,
        date: new Date(dto.date),
        notes: dto.notes,
      },
      include: {
        customer: { select: { name: true, phone: true } },
        businessLead: { select: { companyName: true } },
      },
    });
  }

  async getAcquisitions(executiveId: string, date: string, page: number, limit: number) {
    const day = new Date(date);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.acquisitionLog.findMany({
        where: { executiveId, date: day },
        include: {
          customer: { select: { name: true, phone: true } },
          businessLead: { select: { companyName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.acquisitionLog.count({ where: { executiveId, date: day } }),
    ]);
    return { items, total, page, limit };
  }

  // ─── BUSINESS LEADS ──────────────────────────────────────

  async createBusinessLead(dto: CreateBusinessLeadDto, executiveId: string, branchId: string) {
    return this.prisma.businessLead.create({
      data: {
        branch: { connect: { id: branchId } },
        executive: { connect: { id: executiveId } },
        companyName: dto.companyName,
        contactPerson: dto.contactPerson,
        phone: dto.phone,
        email: dto.email,
        industry: dto.industry,
        estimatedValue: dto.estimatedValue,
        notes: dto.notes,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
      },
    });
  }

  async getBusinessLeads(executiveId: string, status: string | undefined, page: number, limit: number) {
    const where: any = { executiveId };
    if (status) where.status = status;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.businessLead.findMany({
        where,
        include: { interactions: { orderBy: { date: 'desc' }, take: 3 } },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.businessLead.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async updateBusinessLead(id: string, dto: UpdateBusinessLeadDto, executiveId: string) {
    const data: any = { ...dto };
    if (dto.followUpDate) data.followUpDate = new Date(dto.followUpDate);
    if (dto.status === 'SIGNED') data.signedAt = new Date();
    return this.prisma.businessLead.update({
      where: { id },
      data,
    });
  }

  async addInteraction(dto: AddInteractionDto, executiveId: string) {
    return this.prisma.businessInteraction.create({
      data: {
        businessLead: { connect: { id: dto.businessLeadId } },
        executive: { connect: { id: executiveId } },
        date: new Date(dto.date),
        outcome: dto.outcome,
        notes: dto.notes,
      },
    });
  }

  // ─── OWNER ANALYTICS ─────────────────────────────────────

  async getAnalytics(branchId: string, from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const [totalIndividual, totalBusiness, byExecutive, bySource, businessByStatus] = await Promise.all([
      this.prisma.acquisitionLog.count({
        where: { branchId, type: 'INDIVIDUAL', date: { gte: fromDate, lte: toDate } },
      }),
      this.prisma.acquisitionLog.count({
        where: { branchId, type: 'BUSINESS', date: { gte: fromDate, lte: toDate } },
      }),
      this.prisma.acquisitionLog.groupBy({
        by: ['executiveId'],
        where: { branchId, date: { gte: fromDate, lte: toDate } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.acquisitionLog.groupBy({
        by: ['source'],
        where: { branchId, date: { gte: fromDate, lte: toDate } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.businessLead.groupBy({
        by: ['status'],
        where: { branchId },
        _count: { id: true },
      }),
    ]);

    // Enrich executive names
    const executiveIds = byExecutive.map((e) => e.executiveId);
    const executives = await this.prisma.user.findMany({
      where: { id: { in: executiveIds } },
      select: { id: true, name: true },
    });
    const execMap = Object.fromEntries(executives.map((e) => [e.id, e.name]));

    return {
      totalIndividual,
      totalBusiness,
      totalAcquisitions: totalIndividual + totalBusiness,
      byExecutive: byExecutive.map((e) => ({
        executiveId: e.executiveId,
        name: execMap[e.executiveId] ?? 'Unknown',
        count: e._count.id,
      })),
      bySource: bySource.map((s) => ({ source: s.source, count: s._count.id })),
      businessByStatus: businessByStatus.map((b) => ({ status: b.status, count: b._count.id })),
    };
  }

  async getSalesExecutives(branchId: string) {
    return this.prisma.user.findMany({
      where: { branchId, role: 'SALES_EXECUTIVE', active: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
  }
}
