import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, DollarSign, Clock, User, Car, MessageCircle, AlertCircle, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatBs } from "@/lib/currency";
import { createWhatsAppLink } from "@/lib/phone";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";

interface ReservationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: any;
  isOwner: boolean;
}

export function ReservationDetailsDialog({ 
  open, 
  onOpenChange, 
  reservation: initialReservation,
  isOwner 
}: ReservationDetailsDialogProps) {
  const [reservation, setReservation] = useState(initialReservation);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Refetch reservation with full data when dialog opens
  useEffect(() => {
    if (open && initialReservation?.id) {
      fetchFullReservationData();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel(`reservation-${initialReservation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'reservations',
            filter: `id=eq.${initialReservation.id}`,
          },
          (payload) => {
            console.log('Reservation updated:', payload);
            fetchFullReservationData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, initialReservation?.id]);

  const fetchFullReservationData = async () => {
    if (!initialReservation?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          vehicles!reservations_vehicle_id_fkey (
            id,
            brand,
            model,
            year,
            city,
            plate,
            title
          )
        `)
        .eq('id', initialReservation.id)
        .single();

      if (error) throw error;

      // Fetch owner and renter separately
      const [ownerResult, renterResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, phone, kyc_status')
          .eq('id', data.owner_id)
          .single(),
        supabase
          .from('profiles')
          .select('id, full_name, phone, kyc_status')
          .eq('id', data.renter_id)
          .single(),
      ]);

      setReservation({
        ...data,
        owner: ownerResult.data || { 
          id: data.owner_id, 
          full_name: 'Desconocido', 
          phone: '',
          kyc_status: 'unverified' 
        },
        renter: renterResult.data || { 
          id: data.renter_id, 
          full_name: 'Desconocido', 
          phone: '',
          kyc_status: 'unverified' 
        },
      });
    } catch (error) {
      console.error('Error fetching reservation details:', error);
      toast.error('Error al cargar detalles de la reserva');
    } finally {
      setLoading(false);
    }
  };

  if (!reservation) return null;

  // Single source of truth for approval status
  const isApproved =
    reservation.status === 'approved' ||
    reservation.status === 'active' ||
    reservation.status === 'completed';

  const vehicle = reservation.vehicles;
  const otherParty = isOwner ? reservation.renter : reservation.owner;
  const otherPartyLabel = isOwner ? "Arrendatario" : "Propietario";

  // Status configuration
  const statusConfig = {
    requested: { label: "Solicitada", color: "bg-amber-500", textColor: "text-amber-900 dark:text-amber-100" },
    approved: { label: "Aprobada", color: "bg-green-500", textColor: "text-green-900 dark:text-green-100" },
    active: { label: "Activa", color: "bg-blue-500", textColor: "text-blue-900 dark:text-blue-100" },
    overdue: { label: "Con Retraso", color: "bg-red-500", textColor: "text-red-900 dark:text-red-100" },
    completed: { label: "Completada", color: "bg-gray-500", textColor: "text-gray-900 dark:text-gray-100" },
    rejected: { label: "Rechazada", color: "bg-destructive", textColor: "text-destructive-foreground" },
    canceled: { label: "Cancelada", color: "bg-muted", textColor: "text-muted-foreground" },
  };

  const currentStatus = statusConfig[reservation.status as keyof typeof statusConfig] || 
    { label: reservation.status, color: "bg-secondary", textColor: "text-secondary-foreground" };

  // WhatsApp link generation
  const whatsappLink = isApproved && otherParty?.phone 
    ? createWhatsAppLink(
        otherParty.phone,
        `Hola ${otherParty.full_name}, te contacto sobre la reserva ${reservation.id.slice(0, 8)}`
      )
    : null;

  const handlePaymentComplete = async (method: "cashea" | "mercantil") => {
    setProcessingPayment(true);
    try {
      // Try primary edge function first
      const { data, error } = await supabase.functions.invoke('simulate-payment', {
        body: {
          reservation_id: reservation.id,
          method,
        },
      });

      if (error) {
        console.warn('Primary edge function failed, trying fallback...', error);
        
        // Fallback: use alternative edge function
        const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke('mark-payment-simulated', {
          body: {
            reservation_id: reservation.id,
            method,
            amount_bs: reservation.final_total_bs || reservation.total_price_bs || reservation.total,
          },
        });

        if (fallbackError) {
          console.error('Fallback also failed, using direct database update:', fallbackError);
          
          // Last resort: direct database update with RLS
          const totalAmount = reservation.final_total_bs || reservation.total_price_bs || reservation.total || 0;
          
          const { data: payment, error: paymentInsertError } = await supabase
            .from('payments')
            .insert({
              reservation_id: reservation.id,
              amount_total: totalAmount,
              upfront: method === 'cashea' ? Math.round(totalAmount * 0.25) : totalAmount,
              installments: method === 'cashea' ? 3 : 0,
              method: method === 'cashea' ? 'cashea_sim' : 'full',
              status: 'paid',
              currency: 'Bs',
              provider_ref: `CLIENT-${method.toUpperCase()}-${Date.now()}`,
            })
            .select()
            .single();

          if (paymentInsertError) throw paymentInsertError;

          const { error: reservationUpdateError } = await supabase
            .from('reservations')
            .update({ 
              payment_status: 'simulated'
            } as any)
            .eq('id', reservation.id);

          if (reservationUpdateError) throw reservationUpdateError;

          toast.success('Pago procesado exitosamente', {
            description: 'Pago simulado registrado automáticamente',
          });
        } else {
          toast.success('Pago procesado exitosamente', {
            description: 'Recibirás un correo con los detalles del pago',
          });
        }
      } else {
        toast.success('Pago procesado exitosamente', {
          description: 'Recibirás un correo con los detalles del pago',
        });
      }

      // Refresh reservation data
      await fetchFullReservationData();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Error al procesar el pago', {
        description: error.message || 'Intenta nuevamente',
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  // Check if payment button should be shown (single source of truth)
  const canPay = 
    !isOwner &&
    reservation.status === 'approved' &&
    reservation.payment_status !== 'paid' &&
    reservation.payment_status !== 'simulated';

  const shouldShowPayButton = canPay;

  // Contact visibility logic
  const getContactSection = () => {
    if (isApproved) {
      // Show contact info
      return (
        <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
          <div>
            <p className="text-sm font-medium mb-1">Nombre</p>
            <p className="text-base">{otherParty?.full_name || "No disponible"}</p>
          </div>

          {whatsappLink ? (
            <div>
              <p className="text-sm font-medium mb-2">Contacto</p>
              <Button
                onClick={() => window.open(whatsappLink, '_blank')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contactar por WhatsApp
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-900 dark:text-green-200">
                  El arrendador se pondrá en contacto contigo. Ya le enviamos tus datos para coordinar la entrega del vehículo.
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (reservation.status === 'requested') {
      return (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
          <div className="flex items-start gap-2">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-200 mb-1">
                Esperando aprobación
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Tu solicitud fue enviada. El propietario debe aprobarla para habilitar el contacto.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (reservation.status === 'rejected') {
      return (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive mb-1">Reserva rechazada</p>
              {reservation.rejection_reason && (
                <p className="text-sm text-destructive/80">
                  Motivo: {reservation.rejection_reason}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Fallback for other statuses
    return (
      <div className="p-4 rounded-lg bg-secondary/50">
        <p className="text-sm text-muted-foreground">
          Información de contacto no disponible para esta reserva
        </p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalles de la Reserva</DialogTitle>
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado con aria-live para accesibilidad */}
          <div className="flex items-center justify-between" aria-live="polite">
            <span className="text-sm text-muted-foreground">Estado</span>
            <Badge className={`${currentStatus.color} ${currentStatus.textColor}`}>
              {currentStatus.label}
            </Badge>
          </div>

          {/* Información del Vehículo */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Car className="h-5 w-5" />
              Información del Vehículo
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/50">
              <div>
                <p className="text-sm text-muted-foreground">Vehículo</p>
                <p className="font-medium">{vehicle?.title || `${vehicle?.brand} ${vehicle?.model}`}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Marca y Modelo</p>
                <p className="font-medium">{vehicle?.brand} {vehicle?.model} {vehicle?.year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Ubicación
                </p>
                <p className="font-medium">{vehicle?.city || "No especificada"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Placa</p>
                <p className="font-medium">{vehicle?.plate || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fechas de la Reserva
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/50">
              <div>
                <p className="text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Retiro
                </p>
                <p className="font-medium">
                  {reservation.start_at 
                    ? format(new Date(reservation.start_at), "PPP 'a las' HH:mm", { locale: es })
                    : reservation.start_date 
                    ? format(new Date(reservation.start_date), "PPP", { locale: es })
                    : "No disponible"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Devolución
                </p>
                <p className="font-medium">
                  {reservation.end_at 
                    ? format(new Date(reservation.end_at), "PPP 'a las' HH:mm", { locale: es })
                    : reservation.end_date 
                    ? format(new Date(reservation.end_date), "PPP", { locale: es })
                    : "No disponible"}
                </p>
              </div>
            </div>
          </div>

          {/* Costos */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Desglose de Costos
            </h3>
            <div className="space-y-2 p-4 rounded-lg bg-secondary/50">
              {reservation.pricing_mode && (
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Modalidad</span>
                  <span className="capitalize">{reservation.pricing_mode}</span>
                </div>
              )}
              
              {reservation.daily_price && (
                <div className="flex justify-between">
                  <span className="text-sm">Precio diario</span>
                  <span className="font-medium">{formatBs(reservation.daily_price)}</span>
                </div>
              )}
              
              {reservation.hourly_rate_bs && (
                <div className="flex justify-between">
                  <span className="text-sm">Tarifa por hora</span>
                  <span className="font-medium">{formatBs(reservation.hourly_rate_bs)}</span>
                </div>
              )}
              
              {reservation.subtotal && (
                <div className="flex justify-between">
                  <span className="text-sm">Subtotal</span>
                  <span className="font-medium">{formatBs(reservation.subtotal)}</span>
                </div>
              )}
              
              {reservation.service_fee && (
                <div className="flex justify-between">
                  <span className="text-sm">Tarifa de servicio</span>
                  <span className="font-medium">{formatBs(reservation.service_fee)}</span>
                </div>
              )}

              {reservation.overage_hours > 0 && (
                <div className="flex justify-between text-destructive">
                  <span className="text-sm">Cargo por retraso ({reservation.overage_hours}h)</span>
                  <span className="font-medium">
                    {formatBs((reservation.late_fee_per_hour_bs || 0) * reservation.overage_hours)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">
                  {formatBs(reservation.final_total_bs || reservation.total_price_bs || reservation.total || 0)}
                </span>
              </div>

              {/* Payment status badge */}
              {reservation.payment_status && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Estado del pago</span>
                  <Badge variant={reservation.payment_status === 'paid' ? 'default' : 'secondary'}>
                    {reservation.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </Badge>
                </div>
              )}
            </div>

            {/* Payment Button */}
            {shouldShowPayButton && (
              <Button
                onClick={() => setShowPaymentModal(true)}
                disabled={processingPayment}
                className="w-full"
                size="lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pagar reserva
              </Button>
            )}
          </div>

          {/* Services Section - Only show when approved and paid */}
          {!isOwner && isApproved && (reservation.payment_status === 'paid' || reservation.payment_status === 'simulated') && (
            <div className="space-y-4 p-4 rounded-lg border bg-card">
              <h3 className="font-semibold text-lg">Servicios disponibles para tu viaje 🚗</h3>
              <p className="text-sm text-muted-foreground">
                Accede a servicios de asistencia y protección durante tu alquiler
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Tu Gruero Card */}
                <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">Asistencia Tu Gruero</h4>
                      <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                        Usa Tu Gruero si necesitas ayuda básica en carretera o remolcar el vehículo hasta un taller cercano.
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 font-medium">
                        📞 Disponible las 24 h en todo el país
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => window.open('https://tugruero.com/', '_blank')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    Contactar Tu Gruero
                  </Button>
                </div>

                {/* RCV Insurance Card */}
                <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                      <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Seguro RCV activo</h4>
                      <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                        Cubre daños ocasionados a terceros o al vehículo arrendado en caso de accidente.
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 font-medium">
                        🛡️ Consulta tu cobertura o reporta un siniestro
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => toast.info('Contacto con aseguradora', {
                      description: 'En producción, aquí se mostraría información de la aseguradora asociada'
                    })}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                    size="sm"
                  >
                    Ver cobertura RCV
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Show message when not paid yet */}
          {!isOwner && isApproved && reservation.payment_status !== 'paid' && reservation.payment_status !== 'simulated' && (
            <div className="p-4 rounded-lg bg-secondary/50 border">
              <p className="text-sm text-muted-foreground text-center">
                Los servicios estarán disponibles una vez que el pago sea confirmado.
              </p>
            </div>
          )}

          {/* Información del otro usuario */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              {otherPartyLabel}
            </h3>
            {getContactSection()}
          </div>

          {/* ID de Reserva */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              ID de reserva: {reservation.id}
            </p>
            {reservation.created_at && (
              <p className="text-xs text-muted-foreground">
                Creada el: {format(new Date(reservation.created_at), "PPP 'a las' p", { locale: es })}
              </p>
            )}
          </div>
        </div>

        {/* Payment Method Selector Modal */}
        <PaymentMethodSelector
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          totalAmount={reservation.final_total_bs || reservation.total_price_bs || reservation.total || 0}
          onPaymentComplete={handlePaymentComplete}
        />
      </DialogContent>
    </Dialog>
  );
}
