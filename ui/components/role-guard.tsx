"use client";
import { useAuthStore } from '../lib/auth-store';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'accountant' | 'customer')[];
  fallback?: React.ReactNode;
}

export default function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const user = useAuthStore((state) => state.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
