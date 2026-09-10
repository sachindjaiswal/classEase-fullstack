import api from './axios';
import type { Announcement, AnnouncementInput } from '@/types';

export const createAnnouncement = (payload: AnnouncementInput) =>
    api.post<{ message: string; announcement: Announcement }>('/announcements', payload);

export const getAnnouncements = () =>
    api.get<{ message: string; announcements: Announcement[] }>('/announcements');

export const getAnnouncement = (id: number) =>
    api.get<{ message: string; announcement: Announcement }>(`/announcements/${id}`);

export const updateAnnouncement = (id: number, payload: Partial<AnnouncementInput>) =>
    api.put<{ message: string; announcement: Announcement }>(`/announcements/${id}`, payload);

export const deleteAnnouncement = (id: number) =>
    api.delete<{ message: string }>(`/announcements/${id}`);

export const getAnnouncementsByClass = (classId: number) =>
    api.get<{ message: string; announcements: Announcement[] }>(`/announcements/class/${classId}`);

export const getAnnouncementsByStudent = (studentId: number) =>
    api.get<{ message: string; announcements: Announcement[] }>(`/announcements/student/${studentId}`);