import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
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
import UserDashboard from "./pages/UserDashboard";
import KYC from "./pages/KYC";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/explorar" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
            <Route path="/mapa" element={<ProtectedRoute><MapExplore /></ProtectedRoute>} />
            <Route path="/carro/:id" element={<ProtectedRoute><CarDetail /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/vehiculos" element={<ProtectedRoute><AdminVehicles /></ProtectedRoute>} />
            <Route path="/admin/reservas" element={<ProtectedRoute><AdminReservations /></ProtectedRoute>} />
            <Route path="/admin/pagos" element={<ProtectedRoute><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/reportes" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/configuracion" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
