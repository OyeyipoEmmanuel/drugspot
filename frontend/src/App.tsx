import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { LoadingState } from "@/components/feedback-states";
import { AdminLayout } from "@/layouts/admin-layout";
import { AuthLayout } from "@/layouts/auth-layout";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { PatientLayout } from "@/layouts/patient-layout";
import { GuestOnly, RequireAuth } from "@/routes/route-guards";

const AdminPage = lazy(() => import("@/pages/admin-page").then((module) => ({ default: module.AdminPage })));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/forgot-password-page").then((module) => ({ default: module.ForgotPasswordPage })));
const LoginPage = lazy(() => import("@/pages/auth/login-page").then((module) => ({ default: module.LoginPage })));
const OnboardingPage = lazy(() => import("@/pages/auth/onboarding-page").then((module) => ({ default: module.OnboardingPage })));
const RegisterPage = lazy(() => import("@/pages/auth/register-page").then((module) => ({ default: module.RegisterPage })));
const WelcomePage = lazy(() => import("@/pages/auth/welcome-page").then((module) => ({ default: module.WelcomePage })));
const DashboardPage = lazy(() => import("@/pages/dashboard-page").then((module) => ({ default: module.DashboardPage })));
const HomePage = lazy(() => import("@/pages/home-page").then((module) => ({ default: module.HomePage })));
const MedicationDetailPage = lazy(() => import("@/pages/medications/medication-detail-page").then((module) => ({ default: module.MedicationDetailPage })));
const MedicationFormPage = lazy(() => import("@/pages/medications/medication-form-page").then((module) => ({ default: module.MedicationFormPage })));
const MedicationsPage = lazy(() => import("@/pages/medications/medications-page").then((module) => ({ default: module.MedicationsPage })));
const OcrScanPage = lazy(() => import("@/pages/medications/ocr-scan-page").then((module) => ({ default: module.OcrScanPage })));
const MarketplacePage = lazy(() => import("@/pages/marketplace/marketplace-page").then((module) => ({ default: module.MarketplacePage })));
const ProductDetailPage = lazy(() => import("@/pages/marketplace/product-detail-page").then((module) => ({ default: module.ProductDetailPage })));
const PharmaciesPage = lazy(() => import("@/pages/marketplace/pharmacies-page").then((module) => ({ default: module.PharmaciesPage })));
const PharmacyDetailPage = lazy(() => import("@/pages/marketplace/pharmacy-detail-page").then((module) => ({ default: module.PharmacyDetailPage })));
const CartPage = lazy(() => import("@/pages/marketplace/cart-page").then((module) => ({ default: module.CartPage })));
const CheckoutPage = lazy(() => import("@/pages/marketplace/checkout-page").then((module) => ({ default: module.CheckoutPage })));
const OrdersPage = lazy(() => import("@/pages/orders/orders-page").then((module) => ({ default: module.OrdersPage })));
const OrderDetailPage = lazy(() => import("@/pages/orders/order-detail-page").then((module) => ({ default: module.OrderDetailPage })));
const PlaceholderPage = lazy(() => import("@/pages/placeholder-page").then((module) => ({ default: module.PlaceholderPage })));
const ProfilePage = lazy(() => import("@/pages/profile-page").then((module) => ({ default: module.ProfilePage })));
const UnauthorizedPage = lazy(() => import("@/pages/unauthorized-page").then((module) => ({ default: module.UnauthorizedPage })));

export default function App() {
  return (
    <Suspense fallback={<LoadingState label="Opening DrugSpot…" />}><Routes>
      <Route element={<GuestOnly />}>
        <Route element={<AuthLayout />}>
          <Route path="welcome" element={<WelcomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
        </Route>
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="onboarding" element={<OnboardingPage />} />
      </Route>
      <Route element={<RequireAuth roles={["patient"]} />}>
        <Route element={<PatientLayout />}>
          <Route index element={<HomePage />} />
          <Route path="medicines" element={<MedicationsPage />} />
          <Route path="medicines/new" element={<MedicationFormPage />} />
          <Route path="medicines/scan" element={<OcrScanPage />} />
          <Route path="medicines/:id" element={<MedicationDetailPage />} />
          <Route path="medicines/:id/edit" element={<MedicationFormPage />} />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="marketplace/products/:id" element={<ProductDetailPage />} />
          <Route path="marketplace/pharmacies" element={<PharmaciesPage />} />
          <Route path="marketplace/pharmacies/:id" element={<PharmacyDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="pharmacist" element={<PlaceholderPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route element={<RequireAuth roles={["pharmacist", "pharmacy_admin"]} />}>
        <Route path="pharmacy" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<PlaceholderPage />} />
          <Route path="inventory" element={<PlaceholderPage />} />
          <Route path="customers" element={<PlaceholderPage />} />
          <Route path="refills" element={<PlaceholderPage />} />
        </Route>
      </Route>
      <Route element={<RequireAuth roles={["platform_admin"]} />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminPage />} />
          <Route path="pharmacies" element={<PlaceholderPage />} />
          <Route path="pharmacists" element={<PlaceholderPage />} />
          <Route path="verifications" element={<PlaceholderPage />} />
        </Route>
      </Route>
      <Route path="unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes></Suspense>
  );
}
