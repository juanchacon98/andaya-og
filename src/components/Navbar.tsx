import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Map, Menu, X, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSecureSignOut } from "@/hooks/useSecureSignOut";


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { signOut } = useSecureSignOut();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminRole();
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin_primary");

    setIsAdmin(roles && roles.length > 0);
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="container flex h-12 sm:h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2">
          <img src="/favicon.png" alt="AndaYa Logo" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
          <span className="text-lg sm:text-xl font-bold">AndaYa</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2 lg:gap-4">
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="text-sm lg:text-base text-primary">
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}
          <Link to="/explorar">
            <Button variant="ghost" size="sm" className="text-sm lg:text-base">
              Explorar carros
            </Button>
          </Link>
          <Link to="/mapa">
            <Button variant="ghost" size="sm" className="text-sm lg:text-base">
              <Map className="h-4 w-4 mr-2" />
              Ver mapa
            </Button>
          </Link>
          {user ? (
            <>
              <Link to="/perfil">
                <Button variant="ghost" size="sm" className="text-sm lg:text-base">
                  Mi perfil
                </Button>
              </Link>
              <Button onClick={signOut} variant="outline" size="sm" className="text-sm lg:text-base">
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm" className="text-sm lg:text-base">
                  Iniciar sesión
                </Button>
              </Link>
              <Link to="/registro">
                <Button size="sm" className="text-sm lg:text-base">
                  Registrarse
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 hover:bg-accent/10 rounded-lg transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/98 backdrop-blur-lg animate-fade-in">
          <div className="container px-4 py-4 space-y-2">
            {isAdmin && (
              <Link to="/admin" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-base text-primary" size="lg">
                  <Shield className="h-5 w-5 mr-2" />
                  Panel Admin
                </Button>
              </Link>
            )}
            <Link to="/explorar" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-base" size="lg">
                Explorar carros
              </Button>
            </Link>
            <Link to="/mapa" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-base" size="lg">
                <Map className="h-5 w-5 mr-2" />
                Ver mapa
              </Button>
            </Link>
            {user ? (
              <>
                <Link to="/perfil" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-base" size="lg">
                    Mi perfil
                  </Button>
                </Link>
                <Button 
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }} 
                  variant="outline" 
                  className="w-full text-base" 
                  size="lg"
                >
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full text-base" size="lg">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link to="/registro" onClick={() => setIsOpen(false)}>
                  <Button className="w-full text-base" size="lg">
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
