import api from './axios';
import type { DashboardFeed, DashboardStats } from '@/types';

export function getDashboardStats() {
    return api.get<DashboardStats>('/dashboard/stats');
}

export function getDashboardFeed() {
    return api.get<DashboardFeed>('/dashboard/feed');
}