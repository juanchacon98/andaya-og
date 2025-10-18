import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Palette, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [colors, setColors] = useState({
    primary: "#00B2FF",
    accent: "#FFC300",
    navy: "#1E2A38",
  });

  const handleColorChange = (key: string, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Aquí se implementaría la lógica para guardar en localStorage o backend
    localStorage.setItem("andaya_custom_colors", JSON.stringify(colors));
    toast({
      title: "Configuración guardada",
      description: "Los colores se han actualizado correctamente",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12 bg-gradient-to-b from-background to-secondary/30">
        <div className="container px-4 mx-auto max-w-4xl">
          <div className="mb-8">
            <div className="flex gap-2 mb-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/admin")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/admin/usuarios")}
              >
                Ver Usuarios
              </Button>
            </div>
            <h1 className="text-4xl font-bold mb-2">Configuración UI/UX</h1>
            <p className="text-muted-foreground">
              Personaliza la apariencia de la plataforma
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Colores de Marca
              </CardTitle>
              <CardDescription>
                Personaliza los colores principales de la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary">Color Primario (Azul AndaYa)</Label>
                  <div className="flex gap-4 items-center">
                    <Input
                      id="primary"
                      type="color"
                      value={colors.primary}
                      onChange={(e) => handleColorChange("primary", e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={colors.primary}
                      onChange={(e) => handleColorChange("primary", e.target.value)}
                      className="flex-1"
                    />
                    <div 
                      className="w-20 h-10 rounded-md border"
                      style={{ backgroundColor: colors.primary }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent">Color de Acento (Amarillo)</Label>
                  <div className="flex gap-4 items-center">
                    <Input
                      id="accent"
                      type="color"
                      value={colors.accent}
                      onChange={(e) => handleColorChange("accent", e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={colors.accent}
                      onChange={(e) => handleColorChange("accent", e.target.value)}
                      className="flex-1"
                    />
                    <div 
                      className="w-20 h-10 rounded-md border"
                      style={{ backgroundColor: colors.accent }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="navy">Color Navy (Fondo Oscuro)</Label>
                  <div className="flex gap-4 items-center">
                    <Input
                      id="navy"
                      type="color"
                      value={colors.navy}
                      onChange={(e) => handleColorChange("navy", e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={colors.navy}
                      onChange={(e) => handleColorChange("navy", e.target.value)}
                      className="flex-1"
                    />
                    <div 
                      className="w-20 h-10 rounded-md border"
                      style={{ backgroundColor: colors.navy }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handleSave} className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vista Previa</CardTitle>
              <CardDescription>
                Así se verán los colores en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-6 rounded-lg" style={{ backgroundColor: colors.primary }}>
                  <h3 className="text-white font-bold text-lg mb-2">Color Primario</h3>
                  <p className="text-white/90">Este es el color principal de AndaYa</p>
                </div>
                <div className="p-6 rounded-lg" style={{ backgroundColor: colors.accent }}>
                  <h3 className="text-foreground font-bold text-lg mb-2">Color de Acento</h3>
                  <p className="text-foreground/80">Usado para destacar elementos importantes</p>
                </div>
                <div className="p-6 rounded-lg" style={{ backgroundColor: colors.navy }}>
                  <h3 className="text-white font-bold text-lg mb-2">Color Navy</h3>
                  <p className="text-white/90">Fondos oscuros y contraste</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminSettings;
