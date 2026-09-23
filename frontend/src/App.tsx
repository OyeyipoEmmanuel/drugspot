import { Navigate, Route, Routes } from "react-router-dom";

import { DashboardLayout } from "@/layouts/dashboard-layout";
import { PatientLayout } from "@/layouts/patient-layout";
import { DashboardPage } from "@/pages/dashboard-page";
import { HomePage } from "@/pages/home-page";
import { PlaceholderPage } from "@/pages/placeholder-page";

export default function App() {
  return (
    <Routes>
      <Route element={<PatientLayout />}>
        <Route index element={<HomePage />} />
        <Route path="medicines" element={<PlaceholderPage />} />
        <Route path="orders" element={<PlaceholderPage />} />
        <Route path="pharmacist" element={<PlaceholderPage />} />
        <Route path="profile" element={<PlaceholderPage />} />
      </Route>
      <Route path="pharmacy" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<PlaceholderPage />} />
        <Route path="inventory" element={<PlaceholderPage />} />
        <Route path="customers" element={<PlaceholderPage />} />
        <Route path="refills" element={<PlaceholderPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
