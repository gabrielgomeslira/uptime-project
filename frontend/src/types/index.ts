export type MonitorType = 'HTTP' | 'HTTPS' | 'PING' | 'DNS' | 'PORT';

export interface Monitor {
    id?: number;
    name: string;
    url: string;
    type: MonitorType;
    port?: number;
    checkInterval: number;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CheckResult {
    id?: number;
    monitor?: Monitor;
    monitorId?: number;
    success: boolean;
    responseTime: number;
    errorMessage?: string;
    checkedAt: string;
}

export interface MonitorStats {
    monitorId: number;
    monitorName: string;
    url: string;
    lastCheckSuccess: boolean;
    lastResponseTime: number;
    lastCheckedAt: string;
    totalChecks: number;
    successfulChecks: number;
    uptimePercentage: number;
    averageResponseTime: number;
} 