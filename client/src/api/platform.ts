import api from './axios';
import type { Tenant, TenantAdminInput, TenantCreateInput, TenantInput } from '@/types';

export const getTenants = () =>
  api.get<{ tenants: Tenant[] }>('/platform/tenants');

export const createTenant = (payload: TenantCreateInput) =>
  api.post<{ message: string; tenant: Tenant }>('/platform/tenants', payload);

export const addTenantAdmin = (id: number, payload: TenantAdminInput) =>
  api.post<{ message: string; admin: object }>(`/platform/tenants/${id}/admins`, payload);

export const updateTenant = (id: number, payload: TenantInput) =>
  api.put<{ message: string; tenant: Tenant }>(`/platform/tenants/${id}`, payload);

export const deleteTenant = (id: number) =>
  api.delete<{ message: string }>(`/platform/tenants/${id}`);

export const deleteUser = (id: number) =>
  api.delete<{ message: string }>(`/platform/users/${id}`);