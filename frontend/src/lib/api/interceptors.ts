export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('acrm_token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('acrm_token', token);
  }
}

export function getTenantId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('acrm_tenant_id');
}

export function setTenantId(tenantId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('acrm_tenant_id', tenantId);
  }
}

export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('acrm_token');
    localStorage.removeItem('acrm_tenant_id');
    localStorage.removeItem('acrm_user');
  }
}
