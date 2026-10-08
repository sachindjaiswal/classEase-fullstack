import api from './axios';
import type { LeaderboardResponse } from '@/types';

export const getLeaderboardByClass = (
    classId: number,
    exam?: string,
    semester?: string,
) =>
    api.get<LeaderboardResponse>('/leaderboard/class/' + classId, {
        params: {
            ...(exam ? { exam } : {}),
            ...(semester ? { semester } : {}),
        },
    });