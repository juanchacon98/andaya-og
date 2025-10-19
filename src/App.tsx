import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ImpersonationBanner } from "./components/ImpersonationBanner";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Explore from "./pages/Explore";
import MapExplore from "./pages/MapExplore";
import CarDetail from "./pages/CarDetail";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminVehicles from "./pages/admin/AdminVehicles";
import AdminReservations from "./pages/admin/AdminReservations";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminReports from "./pages/admin/AdminReports";
import AdminBackups from "./pages/admin/AdminBackups";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminExchangeRates from "./pages/admin/AdminExchangeRates";
import UserDashboard from "./pages/UserDashboard";
import KYC from "./pages/KYC";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import VehicleList from "./pages/owner/VehicleList";
import VehicleWizard from "./pages/owner/VehicleWizard";
import ReservationSuccess from "./pages/ReservationSuccess";
import MisReservas from "./pages/MisReservas";
import PoliticaVerificacion from "./pages/PoliticaVerificacion";
import TratamientoDatos from "./pages/TratamientoDatos";
import Terminos from "./pages/Terminos";
import Transparencia from "./pages/Transparencia";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

function AppContent() {
  const { impersonationData } = useAuth();
  
  return (
    <>
      {impersonationData && (
        <ImpersonationBanner 
          userName={impersonationData.userName} 
          expiresAt={impersonationData.expiresAt} 
        />
      )}
      <div className={impersonationData ? "pt-14" : ""}>
        <Toaster />
        <Sonner />
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/explorar" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
            <Route path="/mapa" element={<ProtectedRoute><MapExplore /></ProtectedRoute>} />
            <Route path="/carro/:id" element={<ProtectedRoute><CarDetail /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/vehiculos" element={<ProtectedRoute><AdminVehicles /></ProtectedRoute>} />
            <Route path="/admin/reservas" element={<ProtectedRoute><AdminReservations /></ProtectedRoute>} />
            <Route path="/admin/pagos" element={<ProtectedRoute><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/reportes" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/tasas" element={<ProtectedRoute><AdminExchangeRates /></ProtectedRoute>} />
            <Route path="/admin/backups" element={<ProtectedRoute><AdminBackups /></ProtectedRoute>} />
            <Route path="/admin/auditoria" element={<ProtectedRoute><AdminAuditLogs /></ProtectedRoute>} />
            <Route path="/admin/configuracion" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            <Route path="/reserva-exitosa" element={<ProtectedRoute><ReservationSuccess /></ProtectedRoute>} />
            <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
            <Route path="/owner" element={<ProtectedRoute><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/owner/vehicles" element={<ProtectedRoute><VehicleList /></ProtectedRoute>} />
            <Route path="/owner/vehicles/new" element={<ProtectedRoute><VehicleWizard /></ProtectedRoute>} />
            <Route path="/owner/vehicles/:id/edit" element={<ProtectedRoute><VehicleWizard /></ProtectedRoute>} />
            <Route path="/mis-reservas" element={<ProtectedRoute><MisReservas /></ProtectedRoute>} />
            <Route path="/politica-verificacion" element={<PoliticaVerificacion />} />
            <Route path="/tratamiento-datos" element={<TratamientoDatos />} />
            <Route path="/terminos" element={<Terminos />} />
            <Route path="/transparencia" element={<Transparencia />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
