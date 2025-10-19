import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Star, MapPin, Users, Fuel, Settings, ArrowLeft, MessageCircle, ChevronLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isBooking, setIsBooking] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [pendingDates, setPendingDates] = useState<string[]>([]);
  const [myReservation, setMyReservation] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchCarDetails();
      fetchUnavailableDates();
      if (user) {
        fetchMyReservation();
        subscribeToReservationUpdates();
      }
    }
  }, [id, user]);

  const fetchCarDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          vehicle_photos (url, sort_order),
          profiles!vehicles_owner_id_fkey (full_name, id)
        `)
        .eq("id", id)
        .eq("status", "active")
        .single();

      if (error) throw error;

      if (!data) {
        toast.error("Vehículo no encontrado");
        return;
      }

      setCar(data);
    } catch (error) {
      console.error("Error loading vehicle:", error);
      toast.error("Error al cargar el vehículo");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnavailableDates = async () => {
    try {
      // Obtener reservas aprobadas/activas y pendientes para este vehículo
      const { data: reservations, error } = await supabase
        .from("reservations")
        .select("start_date, end_date, status")
        .eq("vehicle_id", id)
        .in("status", ["approved", "finished", "pending"]);

      if (error) throw error;

      // Convertir rangos de reservas a array de fechas individuales
      const blockedDates: string[] = [];
      const pendingReservationDates: string[] = [];
      
      reservations?.forEach((reservation) => {
        const start = new Date(reservation.start_date);
        const end = new Date(reservation.end_date);
        const current = new Date(start);
        
        const dates: string[] = [];
        while (current <= end) {
          dates.push(format(current, "yyyy-MM-dd"));
          current.setDate(current.getDate() + 1);
        }

        // Separate by status
        if (reservation.status === "pending") {
          pendingReservationDates.push(...dates);
        } else {
          blockedDates.push(...dates);
        }
      });

      setUnavailableDates(blockedDates);
      setPendingDates(pendingReservationDates);
    } catch (error) {
      console.error("Error loading availability:", error);
    }
  };

  const fetchMyReservation = async () => {
    if (!user || !id) return;
    
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          owner:profiles!reservations_owner_id_fkey (phone)
        `)
        .eq("vehicle_id", id)
        .eq("renter_id", user.id)
        .in("status", ["pending", "approved"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setMyReservation(data);
    } catch (error) {
      console.error("Error fetching my reservation:", error);
    }
  };

  const subscribeToReservationUpdates = () => {
    if (!user || !id) return;

    const channel = supabase
      .channel(`vehicle-${id}-reservations`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `vehicle_id=eq.${id}`,
        },
        (payload) => {
          console.log('Reservation update:', payload);
          fetchMyReservation();
          fetchUnavailableDates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container py-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Vehículo no encontrado</h2>
            <p className="text-muted-foreground mb-6">El vehículo que buscas no está disponible.</p>
            <Link to="/explorar">
              <Button>Explorar vehículos</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const mainPhoto = car.vehicle_photos?.sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800";

  const calculateTotal = () => {
    if (!startDate || !endDate) return { days: 0, subtotal: 0, serviceFee: 0, total: 0 };
    
    const days = differenceInDays(endDate, startDate);
    const subtotal = days * (car.price_bs || 0);
    const serviceFee = subtotal * 0.10; // 10% service fee
    const total = subtotal + serviceFee;
    
    return { days, subtotal, serviceFee, total };
  };

  const handleBookNow = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para reservar");
      navigate("/login");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Por favor selecciona ambas fechas");
      return;
    }

    if (user.id === car.owner_id) {
      toast.error("No puedes reservar tu propio vehículo");
      return;
    }

    setIsBooking(true);
    
    try {
      const { days, subtotal, serviceFee, total } = calculateTotal();
      
      const { data, error } = await supabase
        .from("reservations")
        .insert({
          vehicle_id: car.id,
          renter_id: user.id,
          owner_id: car.owner_id,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          daily_price: car.price_bs,
          subtotal,
          service_fee: serviceFee,
          total,
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("¡Reserva creada exitosamente!");
      navigate(`/reserva-exitosa?id=${data.id}`);
    } catch (error: any) {
      console.error("Error creating reservation:", error);
      toast.error("Error al crear la reserva: " + error.message);
    } finally {
      setIsBooking(false);
    }
  };

  const handleContactOwner = () => {
    const phone = myReservation?.owner?.phone || car.profiles?.phone;
    
    if (!phone) {
      toast.error("No se encontró información de contacto del propietario");
      return;
    }

    // Usar utilidad de normalización
    const normalizeVePhone = (input: string | null | undefined): string | null => {
      if (!input) return null;
      let cleaned = input.replace(/[^\d+]/g, '');
      if (cleaned.startsWith('+58')) cleaned = cleaned.substring(3);
      else if (cleaned.startsWith('58')) cleaned = cleaned.substring(2);
      if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
      if (cleaned.length !== 10 || !cleaned.startsWith('4')) return null;
      return `+58${cleaned}`;
    };

    const normalized = normalizeVePhone(phone);
    if (!normalized) {
      toast.error("El número del propietario no es válido");
      return;
    }

    const message = encodeURIComponent(
      `Hola, te contacto sobre tu ${car.brand} ${car.model} ${car.year} publicado en AndaYa.`
    );
    
    window.open(`https://wa.me/${normalized}?text=${message}`, '_blank');
  };

  const { days, subtotal, serviceFee, total } = calculateTotal();

  const handleGoBack = () => {
    // Si hay historial, volver atrás, si no, ir a explorar
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/explorar');
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Botón flotante para móvil - visible solo en pantallas pequeñas */}
      <button
        onClick={handleGoBack}
        className="fixed top-[88px] left-4 z-[60] lg:hidden flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95"
        aria-label="Volver atrás"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <div className="container py-8">
        {/* Botón de escritorio */}
        <button 
          onClick={handleGoBack}
          className="hidden lg:inline-flex mb-6 items-center gap-2 text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver atrás
        </button>
        
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Image gallery */}
            <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={mainPhoto}
                alt={`${car.brand} ${car.model}`}
                className="h-full w-full object-cover"
              />
            </div>
            
            {/* Car info */}
            <div className="mb-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h1 className="mb-2 text-3xl font-bold">
                    {car.brand} {car.model} {car.year}
                  </h1>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{car.city || "Venezuela"}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {car.type}
                </Badge>
              </div>
              
              <p className="text-muted-foreground">{car.description || car.title}</p>
            </div>
            
            {/* Specifications */}
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-semibold">Especificaciones</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Transmisión</div>
                      <div className="font-medium">{car.transmission || "Manual"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Pasajeros</div>
                      <div className="font-medium">5</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Fuel className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Combustible</div>
                      <div className="font-medium">{car.fuel_type || "Gasolina"}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Owner info */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-semibold">Sobre el dueño</h2>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {car.profiles?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{car.profiles?.full_name || "Propietario"}</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Propietario verificado</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Booking card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">Bs {car.price_bs?.toLocaleString() || 0}</span>
                    <span className="text-muted-foreground">/día</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <DateRangePicker
                    value={{ startDate, endDate }}
                    minDate={new Date()}
                    unavailableDates={unavailableDates}
                    pendingDates={pendingDates}
                    onChange={({ startDate: start, endDate: end }) => {
                      setStartDate(start);
                      setEndDate(end);
                    }}
                  />
                </div>

                {startDate && endDate && days > 0 && (
                  <div className="mb-4 space-y-2 rounded-lg border p-4">
                    <div className="flex justify-between text-sm">
                      <span>Bs {car.price_bs?.toLocaleString()} × {days} días</span>
                      <span>Bs {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tarifa de servicio (10%)</span>
                      <span>Bs {serviceFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Total</span>
                      <span>Bs {total.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                
                {!myReservation && (
                  <Button 
                    className="mb-4 w-full" 
                    size="lg"
                    onClick={handleBookNow}
                    disabled={isBooking || !startDate || !endDate}
                  >
                    {isBooking ? "Procesando..." : "Reservar ahora"}
                  </Button>
                )}

                {myReservation && myReservation.status === 'pending' && (
                  <div className="mb-4 w-full p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-center">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                      Solicitud enviada
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Esperando aprobación del dueño...
                    </p>
                  </div>
                )}

                {myReservation && myReservation.status === 'approved' && (
                  <div className="mb-4 space-y-2">
                    <div className="w-full p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        ¡Reserva aprobada!
                      </p>
                    </div>
                    <Button className="w-full" size="lg">
                      Proceder al pago
                    </Button>
                  </div>
                )}
                
                {myReservation && ['approved'].includes(myReservation.status) && (
                  <Button 
                    variant="outline" 
                    className="w-full mb-4"
                    onClick={handleContactOwner}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contactar al dueño
                  </Button>
                )}
                
                <div className="mt-6 rounded-md bg-secondary/50 p-4 text-center text-sm">
                  <p className="text-muted-foreground">
                    No se te cobrará hasta confirmar tu reserva
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default CarDetail;
