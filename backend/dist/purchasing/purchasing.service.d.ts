import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto, ReceivePurchaseOrderDto, CreateSupplierDto } from './dto/purchasing.dto';
import { Role } from '@prisma/client';
export declare class PurchasingService {
    private prisma;
    constructor(prisma: PrismaService);
    createSupplier(dto: CreateSupplierDto): Promise<{
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        paymentTerms: string | null;
    }>;
    findSuppliers(page?: number, limit?: number): Promise<{
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        paymentTerms: string | null;
    }[]>;
    createPurchaseOrder(dto: CreatePurchaseOrderDto, userId: string, userRole: Role): Promise<{
        supplier: {
            email: string | null;
            name: string;
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            paymentTerms: string | null;
        };
        items: ({
            ingredient: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                unit: string;
                currentCost: import("@prisma/client/runtime/library").Decimal;
                reorderLevel: import("@prisma/client/runtime/library").Decimal;
                supplierId: string | null;
            };
        } & {
            id: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            ingredientId: string;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
            purchaseOrderId: string;
        })[];
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        status: import("@prisma/client").$Enums.PurchaseOrderStatus;
        supplierId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderedAt: Date;
        receivedAt: Date | null;
    }>;
    receivePurchaseOrder(id: string, dto: ReceivePurchaseOrderDto): Promise<{
        supplier: {
            email: string | null;
            name: string;
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            paymentTerms: string | null;
        };
        items: ({
            ingredient: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                unit: string;
                currentCost: import("@prisma/client/runtime/library").Decimal;
                reorderLevel: import("@prisma/client/runtime/library").Decimal;
                supplierId: string | null;
            };
        } & {
            id: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            ingredientId: string;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
            purchaseOrderId: string;
        })[];
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        status: import("@prisma/client").$Enums.PurchaseOrderStatus;
        supplierId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderedAt: Date;
        receivedAt: Date | null;
    }>;
    findPurchaseOrders(branchId: string, page?: number, limit?: number): Promise<({
        supplier: {
            email: string | null;
            name: string;
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            paymentTerms: string | null;
        };
        items: ({
            ingredient: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                unit: string;
                currentCost: import("@prisma/client/runtime/library").Decimal;
                reorderLevel: import("@prisma/client/runtime/library").Decimal;
                supplierId: string | null;
            };
        } & {
            id: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            ingredientId: string;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
            purchaseOrderId: string;
        })[];
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        status: import("@prisma/client").$Enums.PurchaseOrderStatus;
        supplierId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderedAt: Date;
        receivedAt: Date | null;
    })[]>;
    sendPurchaseOrder(id: string): Promise<{
        supplier: {
            email: string | null;
            name: string;
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            paymentTerms: string | null;
        };
        items: ({
            ingredient: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                unit: string;
                currentCost: import("@prisma/client/runtime/library").Decimal;
                reorderLevel: import("@prisma/client/runtime/library").Decimal;
                supplierId: string | null;
            };
        } & {
            id: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            ingredientId: string;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
            purchaseOrderId: string;
        })[];
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        status: import("@prisma/client").$Enums.PurchaseOrderStatus;
        supplierId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderedAt: Date;
        receivedAt: Date | null;
    }>;
}
