import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/providers/auth-provider";
import type { UserRole } from "@/types/auth";

export function RequireAuth({ roles }: { roles?: UserRole[] }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!session.user.onboardingComplete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  if (roles && !roles.includes(session.user.role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}

export function GuestOnly() {
  const { session } = useAuth();
  if (!session) return <Outlet />;
  if (!session.user.onboardingComplete) return <Navigate to="/onboarding" replace />;
  if (session.user.role === "platform_admin") return <Navigate to="/admin" replace />;
  if (session.user.role === "pharmacist" || session.user.role === "pharmacy_admin") {
    return <Navigate to="/pharmacy" replace />;
  }
  return <Navigate to="/" replace />;
}
