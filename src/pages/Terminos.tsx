import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const Terminos = () => {
  useEffect(() => {
    document.title = "Términos y Condiciones del Servicio - AndaYa";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Lee los términos y condiciones de uso de la plataforma AndaYa para alquiler de vehículos entre particulares."
      );
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-[#F9FAFB] py-16 px-4">
        <article className="max-w-[800px] mx-auto bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-foreground mb-8">
            Términos y Condiciones del Servicio
          </h1>

          <div className="space-y-6 text-base md:text-lg text-foreground/90 leading-relaxed">
            <p>
              ¡Bienvenido a AndaYa! Al crear una cuenta o usar nuestra plataforma, 
              aceptas estos términos.
            </p>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                1. AndaYa es una Plataforma de Intermediación
              </h2>
              <p>
                AndaYa no alquila vehículos directamente, sino que conecta a dueños con 
                arrendatarios mediante tecnología segura.
              </p>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                2. Obligaciones del Usuario
              </h2>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Ser mayor de edad y completar la verificación KYC.</li>
                <li>Proporcionar información veraz y mantener tu cuenta segura.</li>
              </ul>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                3. Compromisos del Dueño 🚗
              </h2>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Publicar vehículos de tu propiedad o bajo autorización.</li>
                <li>Mantenerlos en condiciones seguras y legales.</li>
                <li>Cumplir las reservas aprobadas.</li>
              </ul>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                4. Compromisos del Arrendatario 🚙
              </h2>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Tener licencia vigente y usar el vehículo responsablemente.</li>
                <li>Devolverlo en condiciones acordadas.</li>
                <li>Asumir infracciones o multas durante el uso.</li>
              </ul>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                5. Pagos, Comisiones y Cashea
              </h2>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>AndaYa cobra comisiones por cada reserva.</li>
                <li>El arrendatario paga al confirmar; el dueño cobra al finalizar el alquiler.</li>
                <li>Cashea puede ofrecer pagos flexibles bajo sus propios términos.</li>
              </ul>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                6. Seguro y Disputas
              </h2>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Todos los alquileres deben tener póliza activa.</li>
                <li>Los incidentes deben reportarse desde la plataforma.</li>
                <li>AndaYa actúa como mediador, no como parte directa.</li>
              </ul>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                7. Cancelaciones y Sanciones
              </h2>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Las políticas de cancelación las define cada dueño.</li>
                <li>AndaYa puede suspender cuentas por incumplimiento o fraude.</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default Terminos;
