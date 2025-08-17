"use client";
import { useAuthStore } from '../lib/auth-store';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'accountant' | 'customer')[];
  fallback?: React.ReactNode;
}

export default function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const user = useAuthStore((state) => state.user);

  // Debug logging
  console.log('RoleGuard - User:', user);
  console.log('RoleGuard - Allowed roles:', allowedRoles);
  console.log('RoleGuard - User role:', user?.role);
  console.log('RoleGuard - Has access:', user && allowedRoles.includes(user.role));

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
