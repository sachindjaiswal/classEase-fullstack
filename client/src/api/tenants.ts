import api from './axios';
import type { TenantOption } from '@/types';

export const getTenantOptions = () =>
  api.get<{ tenants: TenantOption[] }>('/tenants');