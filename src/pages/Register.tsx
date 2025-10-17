import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email muy largo" }),
  
  password: z.string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
    .max(72, { message: "La contraseña es muy larga" })
    .regex(/[A-Z]/, { message: "Debe tener al menos una mayúscula" })
    .regex(/[a-z]/, { message: "Debe tener al menos una minúscula" })
    .regex(/[0-9]/, { message: "Debe tener al menos un número" })
    .regex(/[^A-Za-z0-9]/, { message: "Debe tener al menos un símbolo" }),
  
  fullName: z.string()
    .trim()
    .min(2, { message: "Nombre muy corto" })
    .max(100, { message: "Nombre muy largo" })
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, { 
      message: "Solo se permiten letras y espacios" 
    }),
  
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState<"renter" | "owner">("renter");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate inputs
      const validated = registerSchema.parse({
        email,
        password,
        fullName,
        confirmPassword
      });

      setIsLoading(true);

      // Sign up user
      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: {
            full_name: validated.fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      // Assign role using the secure function
      if (data.user) {
        const { error: roleError } = await supabase.rpc("assign_initial_role", {
          _user_id: data.user.id,
          _role: userType,
        });

        if (roleError) throw roleError;
      }

      toast({
        title: "¡Cuenta creada!",
        description: "Por favor verifica tu correo electrónico para continuar.",
      });

      navigate("/login");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al registrarse",
          description: error.message || "Ocurrió un error durante el registro",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <Car className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Crear cuenta en AndaYa</CardTitle>
          <CardDescription>
            Completa el formulario para comenzar
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-3">
              <Label>Tipo de usuario</Label>
              <RadioGroup value={userType} onValueChange={(value) => setUserType(value as "renter" | "owner")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="renter" id="renter" />
                  <Label htmlFor="renter" className="font-normal">
                    Usuario que alquila 🚙
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="owner" id="owner" />
                  <Label htmlFor="owner" className="font-normal">
                    Dueño de vehículo 🚗
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Crear cuenta"}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Register;
