import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ReservationSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get("id");

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate("/perfil");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container py-16 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">¡Reserva Exitosa!</h1>
              <p className="text-muted-foreground">
                Tu reserva ha sido creada exitosamente
              </p>
              {reservationId && (
                <p className="text-sm text-muted-foreground">
                  ID de reserva: {reservationId.substring(0, 8)}...
                </p>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Serás redirigido a tu perfil en 5 segundos...
              </p>
              
              <Button 
                onClick={() => navigate("/perfil")} 
                className="w-full"
                size="lg"
              >
                Ir a Mi Perfil
              </Button>
            </div>

            <div className="pt-4 border-t text-sm text-muted-foreground">
              <p>
                El propietario revisará tu solicitud y te contactará pronto.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default ReservationSuccess;
