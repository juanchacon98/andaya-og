import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PlayCircle, ArrowLeft, Shield, Truck, CreditCard, Car } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Transparencia = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container py-12">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Transparencia del Proyecto</h1>
            <p className="text-lg text-muted-foreground">
              AndaYa combina módulos funcionales y simulados para mostrar el potencial completo del ecosistema.
            </p>
          </div>

          {/* Funcionalidades Reales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
                Funcionalidades Reales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Estas funciones están completamente operativas y procesan datos reales:
              </p>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                    </div>
                    <h3 className="font-semibold">Autenticación</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Registro, login y gestión de sesiones con seguridad de nivel empresarial.
                  </p>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                    </div>
                    <h3 className="font-semibold">Publicación de vehículos</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sistema completo de gestión de vehículos con fotos y detalles.
                  </p>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                    </div>
                    <h3 className="font-semibold">Búsqueda y filtros</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Motor de búsqueda avanzado con filtros por ubicación, precio y tipo.
                  </p>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                    </div>
                    <h3 className="font-semibold">Sistema de reservas</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Solicitudes, aprobaciones y gestión de reservas en tiempo real.
                  </p>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                    </div>
                    <h3 className="font-semibold">Dashboard de usuario</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Panel completo para gestionar reservas, vehículos y perfil.
                  </p>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                    </div>
                    <h3 className="font-semibold">Verificación KYC</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sistema de verificación de identidad para propietarios.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Funcionalidades Simuladas */}
          <Card className="border-2 border-amber-200 dark:border-amber-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                Funcionalidades Simuladas (Mock)
              </CardTitle>
              <Badge variant="outline" className="w-fit bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                <span className="text-amber-800 dark:text-amber-200">Para fines demostrativos</span>
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Estas funciones se muestran con fines de demostración y no procesan datos reales:
              </p>
              
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-dashed border-amber-200 dark:border-amber-900 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Truck className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Asistencia en ruta (Tu Gruero)</h3>
                        <Badge variant="secondary" className="text-xs">Mock</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Simulador de solicitud de grúa o asistencia vial 24/7. Muestra el flujo completo 
                        desde la solicitud hasta la confirmación, incluyendo tiempo estimado de llegada.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Proveedor real:</strong> <a href="https://tugruero.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">tugruero.com</a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border-2 border-dashed border-amber-200 dark:border-amber-900 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Seguro RCV</h3>
                        <Badge variant="secondary" className="text-xs">Mock</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Opción de activar seguro de Responsabilidad Civil Vehicular durante el proceso de reserva. 
                        Simula verificación con aseguradoras aliadas de Tu Gruero.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Integración futura con:</strong> Tu Gruero y aseguradoras venezolanas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border-2 border-dashed border-amber-200 dark:border-amber-900 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Pago en cuotas (Cashea)</h3>
                        <Badge variant="secondary" className="text-xs">Mock</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sistema de financiamiento que permite pagar en 4 cuotas sin intereses (inicial + 3 cuotas). 
                        Incluye proceso de preaprobación y desglose de pagos.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Servicio real:</strong> Cashea (financiamiento venezolano)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border-2 border-dashed border-amber-200 dark:border-amber-900 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Car className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Integración Yummy Rides</h3>
                        <Badge variant="secondary" className="text-xs">Mock</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Banner promocional para que arrendatarios se conviertan en conductores de Yummy Rides 
                        y generen ingresos adicionales con su vehículo.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Plataforma real:</strong> <a href="https://www.yummy.com.ve/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Yummy.com.ve</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integraciones Futuras */}
          <Card>
            <CardHeader>
              <CardTitle>Integraciones Futuras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Las funciones simuladas representan integraciones planificadas que se activarán mediante APIs oficiales 
                una vez establecidos los acuerdos comerciales con cada proveedor:
              </p>

              <div className="rounded-lg border p-4 space-y-3 bg-secondary/50">
                <h4 className="font-semibold">Proceso de integración real:</h4>
                <ol className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>1. Firma de acuerdos comerciales con proveedores</li>
                  <li>2. Obtención de credenciales API oficiales</li>
                  <li>3. Implementación de endpoints seguros</li>
                  <li>4. Pruebas de integración en ambiente sandbox</li>
                  <li>5. Certificación y lanzamiento a producción</li>
                </ol>
              </div>

              <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                <p className="text-sm font-medium">Compromiso de transparencia:</p>
                <p className="text-sm text-muted-foreground">
                  Todas las funcionalidades mostradas como "simulación" o "demo" están claramente etiquetadas. 
                  Los usuarios siempre sabrán qué funciones procesan datos reales y cuáles son demostrativas.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4 pt-4">
            <p className="text-muted-foreground">
              ¿Tienes preguntas sobre alguna funcionalidad?
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/explorar">
                <Button size="lg">
                  Explorar vehículos
                </Button>
              </Link>
              <Link to="/registro">
                <Button variant="outline" size="lg">
                  Crear cuenta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Transparencia;
