import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AcquisitionType, SalesPlanPriority, SalesPlanStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  LogAcquisitionDto,
  CreateBusinessLeadDto,
  UpdateBusinessLeadDto,
  AddInteractionDto,
  UpsertTargetDto,
  UpsertWeeklySalesPlanDto,
  RejectWeeklyPlanDto,
} from './dto/sales.dto';

type GeneratedDailyTask = {
  date: string;
  title: string;
  details?: string;
  priority: SalesPlanPriority;
  acquisitionType: AcquisitionType;
  places: string[];
  expectedAcquisitions: number;
  checklist: string[];
};

type WeeklyPlanStep = {
  type: AcquisitionType;
  title: string;
  details?: string;
  priority: SalesPlanPriority;
  places: string[];
};

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  private toIsoDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private parseDateOnly(input: string) {
    const parsed = new Date(`${input}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD.');
    }
    return parsed;
  }

  private getWeekWindow(input: string) {
    const base = this.parseDateOnly(input);
    const day = base.getUTCDay();
    const offset = (day + 6) % 7;
    const weekStart = new Date(base);
    weekStart.setUTCDate(base.getUTCDate() - offset);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    return {
      weekStart,
      weekEnd,
      weekStartKey: this.toIsoDate(weekStart),
      weekEndKey: this.toIsoDate(weekEnd),
    };
  }

  private normalizeSteps(steps: UpsertWeeklySalesPlanDto['steps']): WeeklyPlanStep[] {
    const normalized = steps.map((step) => ({
      type: step.type,
      title: step.title.trim(),
      details: step.details?.trim() || undefined,
      priority: step.priority,
      places: step.places.map((place) => place.trim()).filter(Boolean),
    })).filter((step) => step.title && step.places.length > 0);

    if (normalized.length === 0) {
      throw new BadRequestException('At least one valid weekly plan step is required.');
    }
    return normalized;
  }

  private buildDailyTasks(weekStart: Date, weeklyTarget: number, steps: WeeklyPlanStep[]): GeneratedDailyTask[] {
    const priorityRank: Record<SalesPlanPriority, number> = {
      HIGH: 0,
      MEDIUM: 1,
      LOW: 2,
    };

    const orderedSteps = [...steps].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
    const base = Math.floor(weeklyTarget / 7);
    let remainder = weeklyTarget % 7;
    const tasks: GeneratedDailyTask[] = [];

    for (let i = 0; i < 7; i += 1) {
      const date = new Date(weekStart);
      date.setUTCDate(weekStart.getUTCDate() + i);
      const step = orderedSteps[i % orderedSteps.length];
      const expectedAcquisitions = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;
      const checklist = [
        `Visit ${step.places.join(', ')}`,
        `Execute step: ${step.title}`,
        'Capture acquisition updates before close of day',
      ];

      tasks.push({
        date: this.toIsoDate(date),
        title: step.title,
        details: step.details,
        priority: step.priority,
        acquisitionType: step.type,
        places: step.places,
        expectedAcquisitions,
        checklist,
      });
    }

    return tasks;
  }

  private parseWeeklyPlanSteps(value: unknown): WeeklyPlanStep[] {
    if (!Array.isArray(value)) return [];
    return value as WeeklyPlanStep[];
  }

  private parseDailyTasks(value: unknown): GeneratedDailyTask[] {
    if (!Array.isArray(value)) return [];
    return value as GeneratedDailyTask[];
  }

  private gradePerformance(actual: number, target: number) {
    if (target <= 0) return { grade: 'N/A', scorePct: 0 };
    const scorePct = Math.round((actual / target) * 100);
    if (scorePct >= 110) return { grade: 'A+', scorePct };
    if (scorePct >= 100) return { grade: 'A', scorePct };
    if (scorePct >= 85) return { grade: 'B', scorePct };
    if (scorePct >= 70) return { grade: 'C', scorePct };
    if (scorePct >= 50) return { grade: 'D', scorePct };
    return { grade: 'F', scorePct };
  }

  private async getWeeklyPlanForDate(executiveId: string, date: string) {
    const { weekStart } = this.getWeekWindow(date);
    return this.prisma.weeklySalesTargetPlan.findUnique({
      where: { executiveId_weekStart: { executiveId, weekStart } },
      include: {
        executive: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });
  }

  private formatWeeklyPlan(plan: any) {
    if (!plan) return null;
    return {
      ...plan,
      weekStart: this.toIsoDate(plan.weekStart),
      weekEnd: this.toIsoDate(plan.weekEnd),
      steps: this.parseWeeklyPlanSteps(plan.steps),
      places: Array.isArray(plan.places) ? plan.places : [],
      dailyTasks: this.parseDailyTasks(plan.dailyTasks),
    };
  }

  // ─── TARGETS ────────────────────────────────────────────

  async getTargetForDate(userId: string, date: string) {
    const weeklyPlan = await this.getWeeklyPlanForDate(userId, date);
    if (weeklyPlan?.status === SalesPlanStatus.APPROVED) {
      const tasks = this.parseDailyTasks(weeklyPlan.dailyTasks);
      const todayTask = tasks.find((task) => task.date === date);
      return {
        individualTarget: todayTask?.acquisitionType === 'INDIVIDUAL' ? todayTask.expectedAcquisitions : 0,
        businessTarget: todayTask?.acquisitionType === 'BUSINESS' ? todayTask.expectedAcquisitions : 0,
        weeklyTarget: weeklyPlan.weeklyTarget,
        planStatus: weeklyPlan.status,
      };
    }

    const record = await this.prisma.dailyAcquisitionTarget.findUnique({
      where: { userId_date: { userId, date: new Date(date) } },
    });
    return {
      individualTarget: record?.individualTarget ?? 5,
      businessTarget: record?.businessTarget ?? 2,
      planStatus: weeklyPlan?.status ?? null,
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
    const { weekStart, weekEnd, weekStartKey } = this.getWeekWindow(date);
    const day = new Date(`${date}T00:00:00.000Z`);
    const target = await this.getTargetForDate(executiveId, date);

    const [individualCount, businessCount, weeklyIndividualCount, weeklyBusinessCount, recentLogs, followUps, weeklyPlan] = await Promise.all([
      this.prisma.acquisitionLog.count({
        where: { executiveId, date: day, type: 'INDIVIDUAL' },
      }),
      this.prisma.acquisitionLog.count({
        where: { executiveId, date: day, type: 'BUSINESS' },
      }),
      this.prisma.acquisitionLog.count({
        where: { executiveId, date: { gte: weekStart, lte: weekEnd }, type: 'INDIVIDUAL' },
      }),
      this.prisma.acquisitionLog.count({
        where: { executiveId, date: { gte: weekStart, lte: weekEnd }, type: 'BUSINESS' },
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
      this.getWeeklyPlanForDate(executiveId, date),
    ]);

    const formattedPlan = this.formatWeeklyPlan(weeklyPlan);
    const todayTask = formattedPlan?.dailyTasks.find((task: GeneratedDailyTask) => task.date === date) ?? null;
    const dailyTargetTotal = (target.individualTarget ?? 0) + (target.businessTarget ?? 0);
    const weeklyTargetTotal = formattedPlan?.weeklyTarget ?? null;
    const dailyPerformance = this.gradePerformance(individualCount + businessCount, dailyTargetTotal);
    const weeklyPerformance = weeklyTargetTotal
      ? this.gradePerformance(weeklyIndividualCount + weeklyBusinessCount, weeklyTargetTotal)
      : { grade: 'N/A', scorePct: 0 };

    return {
      date,
      individualCount,
      businessCount,
      individualTarget: target.individualTarget,
      businessTarget: target.businessTarget,
      recentLogs,
      followUps,
      plan: formattedPlan,
      performance: {
        weekStart: weekStartKey,
        weekEnd: this.toIsoDate(weekEnd),
        daily: {
          individualTarget: target.individualTarget,
          businessTarget: target.businessTarget,
          target: dailyTargetTotal,
          individualActual: individualCount,
          businessActual: businessCount,
          actual: individualCount + businessCount,
          ...dailyPerformance,
        },
        weekly: {
          target: weeklyTargetTotal,
          individualActual: weeklyIndividualCount,
          businessActual: weeklyBusinessCount,
          actual: weeklyIndividualCount + weeklyBusinessCount,
          ...weeklyPerformance,
        },
      },
      todayTask,
    };
  }

  // ─── ACQUISITIONS ────────────────────────────────────────

  async logAcquisition(dto: LogAcquisitionDto, executiveId: string, branchId: string) {
    let customerId: string | undefined;

    if (dto.type === 'INDIVIDUAL' && dto.customerPhone) {
      const normalizePhone = (p: string) => {
        const c = p.replace(/[\s\-().+]/g, '');
        if (c.startsWith('233')) return '0' + c.slice(3);
        if (c.startsWith('0')) return c;
        if (c.length === 9) return '0' + c;
        return c;
      };
      const phone = normalizePhone(dto.customerPhone);
      let customer = await this.prisma.customer.findFirst({
        where: { phone },
      });
      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            name: dto.customerName ?? phone,
            phone,
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
    const lead = await this.prisma.businessLead.findUnique({
      where: { id },
      include: { acquisitionLogs: true },
    });
    if (!lead) {
      throw new NotFoundException('Business lead not found.');
    }
    if (lead.status === 'SIGNED' || lead.status === 'LOST') {
      throw new BadRequestException('Signed or lost business leads cannot be updated.');
    }

    const data: any = { ...dto };
    if (dto.followUpDate) data.followUpDate = new Date(dto.followUpDate);
    if (dto.status === 'SIGNED') data.signedAt = new Date();

    const updated = await this.prisma.businessLead.update({
      where: { id },
      data,
    });

    if (dto.status === 'SIGNED') {
      const existingBusinessLog = await this.prisma.acquisitionLog.findFirst({
        where: { businessLeadId: id, executiveId },
      });
      if (!existingBusinessLog) {
        await this.prisma.acquisitionLog.create({
          data: {
            branch: { connect: { id: lead.branchId } },
            executive: { connect: { id: executiveId } },
            businessLead: { connect: { id } },
            type: 'BUSINESS',
            source: 'OTHER',
            date: new Date(),
          },
        });
      }
    }

    return updated;
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

  // ─── WEEKLY PLAN WORKFLOW ───────────────────────────────

  async getMyWeeklyPlan(executiveId: string, weekStart?: string) {
    const lookupDate = weekStart || new Date().toISOString().slice(0, 10);
    const plan = await this.getWeeklyPlanForDate(executiveId, lookupDate);
    return this.formatWeeklyPlan(plan);
  }

  async upsertWeeklyPlan(dto: UpsertWeeklySalesPlanDto, executiveId: string, branchId: string) {
    const { weekStart, weekEnd } = this.getWeekWindow(dto.weekStart);
    const steps = this.normalizeSteps(dto.steps);
    const places = Array.from(new Set(steps.flatMap((step) => step.places)));
    const dailyTasks = this.buildDailyTasks(weekStart, dto.weeklyTarget, steps);

    const existing = await this.prisma.weeklySalesTargetPlan.findUnique({
      where: { executiveId_weekStart: { executiveId, weekStart } },
    });

    if (existing?.status === SalesPlanStatus.APPROVED) {
      throw new BadRequestException('This week\'s plan is already approved and locked.');
    }
    if (existing?.status === SalesPlanStatus.SUBMITTED) {
      throw new BadRequestException('Plan is already submitted and awaiting owner review.');
    }

    if (existing) {
      const updated = await this.prisma.weeklySalesTargetPlan.update({
        where: { id: existing.id },
        data: {
          weeklyTarget: dto.weeklyTarget,
          status: SalesPlanStatus.DRAFT,
          steps,
          places,
          dailyTasks,
          submittedAt: null,
        },
        include: {
          executive: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true } },
        },
      });
      return this.formatWeeklyPlan(updated);
    }

    const created = await this.prisma.weeklySalesTargetPlan.create({
      data: {
        branchId,
        executiveId,
        weekStart,
        weekEnd,
        weeklyTarget: dto.weeklyTarget,
        status: SalesPlanStatus.DRAFT,
        steps,
        places,
        dailyTasks,
      },
      include: {
        executive: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });
    return this.formatWeeklyPlan(created);
  }

  async submitWeeklyPlan(id: string, executiveId: string) {
    const plan = await this.prisma.weeklySalesTargetPlan.findFirst({
      where: { id, executiveId },
    });
    if (!plan) {
      throw new NotFoundException('Weekly plan not found.');
    }
    if (plan.status === SalesPlanStatus.APPROVED) {
      throw new BadRequestException('Approved plans are locked and cannot be submitted again.');
    }
    if (plan.status === SalesPlanStatus.SUBMITTED) {
      throw new BadRequestException('Plan is already submitted and awaiting review.');
    }

    const submitted = await this.prisma.weeklySalesTargetPlan.update({
      where: { id },
      data: {
        status: SalesPlanStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: {
        executive: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });
    return this.formatWeeklyPlan(submitted);
  }

  async getMyDailyTask(executiveId: string, date: string) {
    const plan = await this.getWeeklyPlanForDate(executiveId, date);
    if (!plan) {
      return { date, hasPlan: false, status: null, task: null };
    }
    const formattedPlan = this.formatWeeklyPlan(plan);
    const task = formattedPlan.dailyTasks.find((item: GeneratedDailyTask) => item.date === date) ?? null;
    return {
      date,
      hasPlan: true,
      status: formattedPlan.status,
      weekStart: formattedPlan.weekStart,
      weekEnd: formattedPlan.weekEnd,
      task,
    };
  }

  async getPendingWeeklyPlans(branchId: string, weekStart?: string) {
    const where: any = { branchId, status: SalesPlanStatus.SUBMITTED };
    if (weekStart) {
      const week = this.getWeekWindow(weekStart);
      where.weekStart = week.weekStart;
    }
    const plans = await this.prisma.weeklySalesTargetPlan.findMany({
      where,
      include: {
        executive: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ submittedAt: 'asc' }, { createdAt: 'asc' }],
    });
    return plans.map((plan) => this.formatWeeklyPlan(plan));
  }

  async approveWeeklyPlan(id: string, ownerId: string, branchId: string) {
    const plan = await this.prisma.weeklySalesTargetPlan.findFirst({
      where: { id, branchId },
    });
    if (!plan) {
      throw new NotFoundException('Weekly plan not found.');
    }
    if (plan.status !== SalesPlanStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted plans can be approved.');
    }

    const approved = await this.prisma.weeklySalesTargetPlan.update({
      where: { id },
      data: {
        status: SalesPlanStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: ownerId,
      },
      include: {
        executive: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });
    return this.formatWeeklyPlan(approved);
  }

  async rejectWeeklyPlan(id: string, ownerId: string, branchId: string, dto: RejectWeeklyPlanDto) {
    const comment = dto.comment.trim();
    if (!comment) {
      throw new BadRequestException('A rejection comment is required.');
    }

    const plan = await this.prisma.weeklySalesTargetPlan.findFirst({
      where: { id, branchId },
    });
    if (!plan) {
      throw new NotFoundException('Weekly plan not found.');
    }
    if (plan.status !== SalesPlanStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted plans can be rejected.');
    }

    const rejected = await this.prisma.weeklySalesTargetPlan.update({
      where: { id },
      data: {
        status: SalesPlanStatus.REJECTED,
        ownerComment: comment,
        rejectedAt: new Date(),
        approvedById: ownerId,
      },
      include: {
        executive: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });
    return this.formatWeeklyPlan(rejected);
  }
}
