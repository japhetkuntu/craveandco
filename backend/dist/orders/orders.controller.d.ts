import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateOrderItemsDto, PayOrderDto, AddOrderItemDto } from './dto/orders.dto';
export declare class OrdersController {
    private orders;
    constructor(orders: OrdersService);
    create(dto: CreateOrderDto): Promise<any>;
    getStats(branchId: string, status?: string, channel?: string, paymentMethod?: string, from?: string, to?: string, search?: string, rawCategoryIds?: string | string[]): Promise<{
        count: number;
        totalRevenue: number;
        foodCost: number;
        avgTicket: number;
    }>;
    findLive(branchId: string, page?: string, limit?: string): Promise<any[]>;
    findOne(id: string): Promise<any>;
    updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<any>;
    updateItems(id: string, dto: UpdateOrderItemsDto): Promise<any>;
    addItem(id: string, dto: AddOrderItemDto): Promise<any>;
    removeItem(id: string, itemId: string): Promise<any>;
    pay(id: string, dto: PayOrderDto): Promise<any>;
    findAll(branchId: string, status?: string, channel?: string, paymentMethod?: string, from?: string, to?: string, search?: string, page?: string, limit?: string, rawCategoryIds?: string | string[]): Promise<any[]>;
    cancel(id: string): Promise<any>;
}
