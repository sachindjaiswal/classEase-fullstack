import api from './axios';

export function getDashboardStats() {
    return api.get('/dashboard/stats');
}
