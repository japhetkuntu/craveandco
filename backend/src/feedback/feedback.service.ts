import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto, ResolveFeedbackDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFeedbackDto) {
    return this.prisma.feedbackTicket.create({
      data: dto,
      include: { customer: true },
    });
  }

  async getStats() {
    const [open, inProgress, resolved] = await Promise.all([
      this.prisma.feedbackTicket.count({ where: { status: 'OPEN' } }),
      this.prisma.feedbackTicket.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.feedbackTicket.count({ where: { status: 'RESOLVED' } }),
    ]);
    return { open, inProgress, resolved, total: open + inProgress + resolved };
  }

  async findAll(status?: string, search?: string, page = 0, limit = 10) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    const where: any = {};
    if (status) where.status = status as any;
    if (search?.trim()) {
      const s = search.trim();
      where.OR = [
        { subject: { contains: s, mode: 'insensitive' } },
        { body: { contains: s, mode: 'insensitive' } },
        { customer: { name: { contains: s, mode: 'insensitive' } } },
      ];
    }
    return this.prisma.feedbackTicket.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async resolve(id: string, dto: ResolveFeedbackDto) {
    const ticket = await this.prisma.feedbackTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Feedback ticket not found');
    return this.prisma.feedbackTicket.update({
      where: { id },
      data: { status: 'RESOLVED', resolution: dto.resolution, resolvedAt: new Date() },
      include: { customer: true },
    });
  }
}
