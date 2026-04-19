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
exports.PurchasingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PurchasingService = class PurchasingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSupplier(dto) {
        return this.prisma.supplier.create({ data: dto });
    }
    async findSuppliers(page = 0, limit = 10) {
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return this.prisma.supplier.findMany({
            orderBy: { name: 'asc' },
            take,
            skip,
        });
    }
    async createPurchaseOrder(dto, userId, userRole) {
        const totalAmount = dto.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
        const purchaseOrder = await this.prisma.purchaseOrder.create({
            data: {
                branchId: dto.branchId,
                supplierId: dto.supplierId,
                notes: dto.notes,
                totalAmount,
                items: {
                    create: dto.items.map((i) => ({
                        ingredientId: i.ingredientId,
                        quantity: i.quantity,
                        unitCost: i.unitCost,
                    })),
                },
            },
            include: { items: { include: { ingredient: true } }, supplier: true },
        });
        if (userRole === 'OPERATIONS_MANAGER') {
            await this.prisma.expense.create({
                data: {
                    branchId: dto.branchId,
                    category: 'Purchase Request',
                    amount: totalAmount,
                    description: dto.notes || `Purchase order request for supplier ${purchaseOrder.supplier.name}`,
                    paidBy: userId,
                    approved: null,
                },
            });
        }
        return purchaseOrder;
    }
    async receivePurchaseOrder(id, dto) {
        const po = await this.prisma.purchaseOrder.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!po)
            throw new common_1.NotFoundException('Purchase order not found');
        for (const item of dto.items) {
            const poItem = po.items.find((i) => i.id === item.purchaseOrderItemId);
            if (!poItem)
                continue;
            await this.prisma.purchaseOrderItem.update({
                where: { id: item.purchaseOrderItemId },
                data: { receivedQty: item.receivedQty },
            });
            await this.prisma.inventoryMovement.create({
                data: {
                    ingredientId: poItem.ingredientId,
                    branchId: po.branchId,
                    type: 'PURCHASE_IN',
                    quantity: item.receivedQty,
                    referenceId: po.id,
                },
            });
        }
        return this.prisma.purchaseOrder.update({
            where: { id },
            data: { status: 'RECEIVED', receivedAt: new Date() },
            include: { items: { include: { ingredient: true } }, supplier: true },
        });
    }
    async findPurchaseOrders(branchId, page = 0, limit = 10) {
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return this.prisma.purchaseOrder.findMany({
            where: { branchId },
            include: { items: { include: { ingredient: true } }, supplier: true },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
        });
    }
    async sendPurchaseOrder(id) {
        return this.prisma.purchaseOrder.update({
            where: { id },
            data: { status: 'SENT' },
            include: { items: { include: { ingredient: true } }, supplier: true },
        });
    }
};
exports.PurchasingService = PurchasingService;
exports.PurchasingService = PurchasingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PurchasingService);
//# sourceMappingURL=purchasing.service.js.map