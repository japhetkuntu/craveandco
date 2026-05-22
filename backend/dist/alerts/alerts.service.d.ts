import { PrismaService } from '../prisma/prisma.service';
export declare class AlertsService {
    private prisma;
    constructor(prisma: PrismaService);
    createRule(data: {
        name: string;
        metric: string;
        operator: string;
        threshold: number;
        severity?: string;
    }): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        metric: string;
        operator: string;
        threshold: import("@prisma/client/runtime/library").Decimal;
        severity: import("@prisma/client").$Enums.AlertSeverity;
    }>;
    findRules(page?: number, limit?: number): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        metric: string;
        operator: string;
        threshold: import("@prisma/client/runtime/library").Decimal;
        severity: import("@prisma/client").$Enums.AlertSeverity;
    }[]>;
    findAlerts(branchId: string, status?: string, page?: number, limit?: number): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AlertStatus;
        type: string;
        message: string;
        severity: import("@prisma/client").$Enums.AlertSeverity;
    }[]>;
    acknowledgeAlert(id: string): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AlertStatus;
        type: string;
        message: string;
        severity: import("@prisma/client").$Enums.AlertSeverity;
    }>;
    resolveAlert(id: string): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AlertStatus;
        type: string;
        message: string;
        severity: import("@prisma/client").$Enums.AlertSeverity;
    }>;
    getSummary(branchId: string): Promise<any>;
    createAlert(branchId: string, type: string, severity: string, message: string): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AlertStatus;
        type: string;
        message: string;
        severity: import("@prisma/client").$Enums.AlertSeverity;
    }>;
}
