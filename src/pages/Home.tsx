import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Shield, CreditCard, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroBackground from "@/assets/hero-background.jpg";

const Home = () => {
  const steps = [
    {
      icon: MapPin,
      title: "Busca",
      description: "Encuentra el carro perfecto en tu ciudad",
    },
    {
      icon: Shield,
      title: "Verifica",
      description: "Todos nuestros usuarios están verificados",
    },
    {
      icon: CreditCard,
      title: "Reserva",
      description: "Paga de forma segura y flexible",
    },
    {
      icon: Search,
      title: "Disfruta",
      description: "Tu viaje, tu tiempo, tu elección",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section 
        className="relative flex min-h-[600px] items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(135deg, rgba(30, 42, 56, 0.85) 0%, rgba(0, 178, 255, 0.75) 100%), url(${heroBackground})` }}
      >
        <div className="container relative z-10 text-center text-white">
          <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
            Tu viaje, tu tiempo,<br />tu elección
          </h1>
          <p className="mb-8 text-xl md:text-2xl">
            Comparte tu carro y gana dinero de forma segura
          </p>
          
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/explorar">
              <Button size="lg" variant="default" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto">
                Buscar un carro
              </Button>
            </Link>
            <Link to="/registro">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Publicar mi carro
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-4xl font-bold">
            ¿Cómo funciona AndaYa?
          </h2>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <Card key={index}>
                <CardContent className="p-6 text-center">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-accent py-20 text-white">
        <div className="container text-center">
          <h2 className="mb-4 text-4xl font-bold">
            ¿Listo para comenzar?
          </h2>
          <p className="mb-8 text-xl">
            Únete a miles de usuarios que ya confían en AndaYa
          </p>
          <Link to="/registro">
            <Button size="lg" variant="secondary">
              Crear cuenta gratis
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
