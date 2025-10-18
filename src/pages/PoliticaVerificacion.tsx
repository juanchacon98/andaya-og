import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const PoliticaVerificacion = () => {
  useEffect(() => {
    document.title = "Política de Verificación - AndaYa";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Conoce cómo AndaYa verifica la identidad de sus usuarios para construir una comunidad de alquiler de vehículos segura y confiable."
      );
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-[#F9FAFB] py-16 px-4">
        <article className="max-w-[800px] mx-auto bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-foreground mb-8">
            Política de Verificación: Construyendo Confianza
          </h1>

          <div className="space-y-6 text-base md:text-lg text-foreground/90 leading-relaxed">
            <p>
              En AndaYa, la confianza es nuestro motor. Para garantizar la seguridad de todos 
              nuestros usuarios, hemos implementado un proceso de verificación de identidad 
              (KYC - Conoce a Tu Cliente) que es obligatorio para todos los miembros de la comunidad.
            </p>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                ¿Por qué te pedimos esto?
              </h2>
              
              <div className="space-y-4">
                <p>
                  <strong>Para Dueños 🚗:</strong> Nos aseguramos de que solo arrendatarios 
                  verificados y con licencias válidas puedan solicitar tu vehículo.
                </p>
                
                <p>
                  <strong>Para Arrendatarios 🚙:</strong> Te damos la tranquilidad de que el 
                  dueño del vehículo ha sido validado, reduciendo riesgos y creando un entorno 
                  de alquiler transparente.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                ¿Cómo funciona el proceso?
              </h2>
              
              <ol className="list-decimal list-inside space-y-3 pl-2">
                <li>
                  <strong>Sube tus Documentos:</strong> Cédula de Identidad y Licencia de 
                  Conducir vigentes.
                </li>
                <li>
                  <strong>Revisión del Equipo:</strong> Validación manual en 2 a 24 h hábiles.
                </li>
                <li>
                  <strong>Estado de Verificación:</strong> Visible en /mi-perfil (Pendiente, 
                  Verificado o Rechazado).
                </li>
              </ol>
            </div>

            <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Importante:
              </h2>
              
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>
                  No podrás publicar ni reservar vehículos hasta completar tu verificación.
                </li>
                <li>
                  Tus documentos son tratados con la máxima confidencialidad.
                </li>
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

export default PoliticaVerificacion;
