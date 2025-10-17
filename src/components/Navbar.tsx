import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Car className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">AndaYa</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link to="/explorar">
            <Button variant="ghost">Explorar carros</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline">Iniciar sesión</Button>
          </Link>
          <Link to="/registro">
            <Button>Registrarse</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
