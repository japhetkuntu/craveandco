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

  async findAll(status?: string, page = 0, limit = 10) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    return this.prisma.feedbackTicket.findMany({
      where: status ? { status: status as any } : {},
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
