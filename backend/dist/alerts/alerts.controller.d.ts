import { AlertsService } from './alerts.service';
export declare class AlertsController {
    private alerts;
    constructor(alerts: AlertsService);
    createRule(body: {
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
    findRules(page?: string, limit?: string): Promise<{
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
    findAlerts(branchId: string, status?: string, page?: string, limit?: string): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AlertStatus;
        type: string;
        severity: import("@prisma/client").$Enums.AlertSeverity;
        message: string;
    }[]>;
    getSummary(branchId: string): Promise<any>;
    acknowledgeAlert(id: string): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AlertStatus;
        type: string;
        severity: import("@prisma/client").$Enums.AlertSeverity;
        message: string;
    }>;
    resolveAlert(id: string): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AlertStatus;
        type: string;
        severity: import("@prisma/client").$Enums.AlertSeverity;
        message: string;
    }>;
}
