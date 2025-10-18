import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileCheck, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RegistrationSuccessProps {
  role: "renter" | "owner";
  userName: string;
}

export function RegistrationSuccess({ role, userName }: RegistrationSuccessProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl">¡Registro exitoso!</CardTitle>
          <CardDescription>
            Bienvenido a AndaYa, {userName}
          </CardDescription>
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              {role === "renter" ? "🚙 Arrendatario" : "🚗 Arrendador"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* KYC Card */}
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <div className="flex items-start gap-3">
                <FileCheck className="h-6 w-6 text-primary mt-1" />
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    Completa tu verificación KYC
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Verifica tu identidad en 2-3 minutos para empezar a usar la plataforma.
                    Es rápido, seguro y necesario para proteger a toda la comunidad.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => navigate("/kyc")}
              >
                Iniciar verificación KYC
              </Button>
            </CardContent>
          </Card>

          {/* Vehicle Publishing Card (only for owners) */}
          {role === "owner" && (
            <Card className="border-secondary">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Car className="h-6 w-6 text-secondary-foreground mt-1" />
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      Publica tu vehículo
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Empieza a generar ingresos compartiendo tu vehículo.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/publicar-vehiculo")}
                >
                  Publicar mi vehículo
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="pt-4">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Ir al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
