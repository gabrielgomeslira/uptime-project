import axios from 'axios';
import { CheckResult, Monitor, MonitorStats } from '../types';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Monitor API
export const getMonitors = () => api.get<Monitor[]>('/monitors');
export const getMonitorById = (id: number) => api.get<Monitor>(`/monitors/${id}`);
export const createMonitor = (monitor: Monitor) => api.post<Monitor>('/monitors', monitor);
export const updateMonitor = (id: number, monitor: Monitor) => api.put<Monitor>(`/monitors/${id}`, monitor);
export const deleteMonitor = (id: number) => api.delete(`/monitors/${id}`);
export const toggleMonitorStatus = (id: number) => api.post<Monitor>(`/monitors/${id}/toggle`);
export const checkMonitorNow = (id: number) => api.post<CheckResult>(`/monitors/${id}/check`);

// Check Results API
export const getResultsByMonitorId = (monitorId: number) => 
    api.get<CheckResult[]>(`/check-results/monitor/${monitorId}`);
export const getResultsByTimeRange = (monitorId: number, start: string, end: string) => 
    api.get<CheckResult[]>(`/check-results/monitor/${monitorId}/time-range`, {
        params: { start, end },
    });

// Statistics API
export const getAllMonitorStats = () => api.get<MonitorStats[]>('/statistics');
export const getMonitorStats = (monitorId: number) => api.get<MonitorStats>(`/statistics/monitor/${monitorId}`);

export default api; 