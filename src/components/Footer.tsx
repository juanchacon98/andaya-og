import { Link } from "react-router-dom";
import { Car, Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-secondary/30 py-12">
      <div className="container">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Car className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">AndaYa</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Movilidad inteligente y compartida.
            </p>
          </div>
          
          <div>
            <h3 className="mb-4 font-semibold">Para usuarios</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/explorar" className="text-muted-foreground hover:text-foreground">
                  Buscar carros
                </Link>
              </li>
              <li>
                <Link to="/registro" className="text-muted-foreground hover:text-foreground">
                  Registrarse
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 font-semibold">Para dueños</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/owner/vehicles/new" className="text-muted-foreground hover:text-foreground">
                  Publicar mi carro
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/politica-verificacion" className="text-muted-foreground hover:text-foreground">
                  Política de Verificación
                </Link>
              </li>
              <li>
                <Link to="/tratamiento-datos" className="text-muted-foreground hover:text-foreground">
                  Tratamiento de Datos
                </Link>
              </li>
              <li>
                <Link to="/terminos" className="text-muted-foreground hover:text-foreground">
                  Términos del Servicio
                </Link>
              </li>
              <li>
                <Link to="/transparencia" className="text-muted-foreground hover:text-foreground">
                  Transparencia
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 font-semibold">Síguenos</h3>
            <div className="flex gap-4">
              <a href="https://facebook.com/andaya" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://instagram.com/andaya" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://twitter.com/andaya" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 AndaYa. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

