import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const TratamientoDatos = () => {
  useEffect(() => {
    document.title = "Política de Privacidad y Tratamiento de Datos - AndaYa";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Conoce cómo AndaYa protege tu privacidad y maneja tus datos personales de forma segura y transparente."
      );
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-[#F9FAFB] py-16 px-4">
        <article className="max-w-[800px] mx-auto bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-foreground mb-8">
            Política de Privacidad y Tratamiento de Datos
          </h1>

          <div className="space-y-6 text-base md:text-lg text-foreground/90 leading-relaxed">
            <p>
              Tu privacidad es una prioridad absoluta en AndaYa. Esta política explica qué 
              datos recopilamos y cómo los usamos para que la plataforma funcione de manera 
              segura y eficiente.
            </p>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                ¿Qué datos recopilamos?
              </h2>
              
              <ul className="list-disc list-inside space-y-3 pl-2">
                <li>
                  <strong>Datos de Identidad:</strong> nombre, correo, documentos KYC.
                </li>
                <li>
                  <strong>Datos del Vehículo:</strong> marca, modelo, año, placa (opcional), fotos.
                </li>
                <li>
                  <strong>Datos de Transacción:</strong> reservas, comunicaciones, reportes.
                </li>
                <li>
                  <strong>Datos de Pago:</strong> gestionados por terceros (como Cashea) de 
                  forma cifrada.
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                ¿Cómo usamos tus datos?
              </h2>
              
              <ul className="list-disc list-inside space-y-3 pl-2">
                <li>Para operar la plataforma.</li>
                <li>Para mantener la seguridad y prevenir fraudes.</li>
                <li>Para comunicarnos contigo con notificaciones relevantes.</li>
              </ul>
            </div>

            <div className="mt-8 bg-green-50 border-l-4 border-green-500 p-6 rounded">
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Nuestro Compromiso:
              </h2>
              
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>No vendemos tus datos.</li>
                <li>Compartimos solo lo necesario para completar reservas.</li>
                <li>
                  Aplicamos cifrado y monitorización activa para proteger tu información.
                </li>
              </ul>
            </div>

            <p className="mt-8 text-sm text-muted-foreground italic">
              Al usar AndaYa, aceptas las prácticas descritas en esta política.
            </p>
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

export default TratamientoDatos;
