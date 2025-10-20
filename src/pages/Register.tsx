import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Car, Users, Building2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { RegistrationSuccess } from "@/components/RegistrationSuccess";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  phone: z.string()
    .trim()
    .min(10, { message: "Teléfono debe tener al menos 10 dígitos" })
    .max(15, { message: "Teléfono muy largo" })
    .regex(/^[0-9+\s()-]+$/, { message: "Formato de teléfono inválido" }),
  
  confirmPassword: z.string(),

  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones",
  }),

  dataProcessingAccepted: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar el tratamiento de datos",
  }),

  verificationPolicyAccepted: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar la política de verificación",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const Register = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<"renter" | "owner">("renter");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [dataProcessingAccepted, setDataProcessingAccepted] = useState(false);
  const [verificationPolicyAccepted, setVerificationPolicyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
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
        phone,
        confirmPassword,
        termsAccepted,
        dataProcessingAccepted,
        verificationPolicyAccepted,
      });

      setIsLoading(true);

      // Sign up user with proper redirect
      const SITE_URL = import.meta.env.VITE_SITE_URL ?? window.location.origin;
      
      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: {
            full_name: validated.fullName,
            phone: validated.phone,
            role: userType,
          },
          emailRedirectTo: `${SITE_URL}/auth/callback`,
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
        title: t('auth.account_created'),
        description: t('auth.verify_email'),
      });

      setRegistrationComplete(true);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: t('auth.validation_error'),
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t('auth.registration_error'),
          description: error.message || "Ocurrió un error durante el registro",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationComplete) {
    return <RegistrationSuccess role={userType} userName={fullName} />;
  }

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
          <CardContent className="space-y-5">
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
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+57 300 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
              <Label className="text-base">Selecciona tu rol</Label>
              <TooltipProvider>
                <div className="grid grid-cols-2 gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          userType === "renter" 
                            ? "border-primary bg-primary/5 ring-2 ring-primary" 
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setUserType("renter")}
                      >
                        <CardContent className="p-4 text-center space-y-2">
                          <Users className="h-8 w-8 mx-auto text-primary" />
                          <div>
                            <p className="font-semibold text-sm">Arrendatario</p>
                            <p className="text-xs text-muted-foreground">Quiero alquilar</p>
                          </div>
                          <Info className="h-4 w-4 mx-auto text-muted-foreground" />
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Usuarios que buscan alquilar vehículos para sus necesidades de transporte.</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          userType === "owner" 
                            ? "border-primary bg-primary/5 ring-2 ring-primary" 
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setUserType("owner")}
                      >
                        <CardContent className="p-4 text-center space-y-2">
                          <Building2 className="h-8 w-8 mx-auto text-primary" />
                          <div>
                            <p className="font-semibold text-sm">Arrendador</p>
                            <p className="text-xs text-muted-foreground">Quiero publicar</p>
                          </div>
                          <Info className="h-4 w-4 mx-auto text-muted-foreground" />
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Propietarios que desean compartir sus vehículos y generar ingresos adicionales.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Acepto los{" "}
                  <a href="/terminos" className="text-primary hover:underline" target="_blank">
                    términos y condiciones
                  </a>
                </label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="dataProcessing" 
                  checked={dataProcessingAccepted}
                  onCheckedChange={(checked) => setDataProcessingAccepted(checked as boolean)}
                />
                <label
                  htmlFor="dataProcessing"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Acepto el{" "}
                  <a href="/tratamiento-datos" className="text-primary hover:underline" target="_blank">
                    tratamiento de mis datos personales
                  </a>
                </label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="verification" 
                  checked={verificationPolicyAccepted}
                  onCheckedChange={(checked) => setVerificationPolicyAccepted(checked as boolean)}
                />
                <label
                  htmlFor="verification"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Acepto la{" "}
                  <a href="/politica-verificacion" className="text-primary hover:underline" target="_blank">
                    política de verificación de identidad
                  </a>
                </label>
              </div>
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
