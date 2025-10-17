import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  Shield, 
  CreditCard, 
  MapPin, 
  Car, 
  Users, 
  Clock, 
  Sparkles,
  TrendingUp,
  Lock,
  Zap
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Home = () => {
  const features = [
    {
      icon: Zap,
      title: "Reserva Instantánea",
      description: "Encuentra y reserva tu carro en menos de 2 minutos",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Lock,
      title: "100% Seguro",
      description: "Verificación de identidad y seguro incluido en cada reserva",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: TrendingUp,
      title: "Gana Dinero",
      description: "Los dueños ganan hasta $2M mensuales compartiendo su carro",
      color: "from-green-500 to-emerald-500"
    },
  ];

  const stats = [
    { number: "15K+", label: "Usuarios activos" },
    { number: "3K+", label: "Carros disponibles" },
    { number: "50K+", label: "Viajes realizados" },
    { number: "4.8★", label: "Calificación promedio" },
  ];

  const steps = [
    {
      icon: MapPin,
      title: "Busca tu carro ideal",
      description: "Explora miles de opciones en tu ciudad",
    },
    {
      icon: Shield,
      title: "Verifica y confía",
      description: "Todos verificados con KYC y seguros",
    },
    {
      icon: CreditCard,
      title: "Paga seguro",
      description: "Métodos de pago flexibles y protegidos",
    },
    {
      icon: Car,
      title: "¡Anda Ya!",
      description: "Recoge y disfruta tu viaje",
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      <Navbar />
      
      {/* Hero Section - Rediseñado */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-[hsl(var(--brand-navy))] via-[hsl(var(--primary))] to-[hsl(var(--brand-blue))] overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 animate-fade-in">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">La forma más fácil de compartir carros en Colombia</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight animate-slide-in-left">
              Anda Ya,
              <br />
              <span className="bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent">
                sin límites
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto text-white/90 animate-slide-in-right">
              Alquila el carro perfecto para tu próxima aventura o gana dinero compartiendo el tuyo
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 animate-scale-in">
              <Link to="/mapa" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 bg-accent hover:bg-accent/90 text-foreground font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <MapPin className="mr-2 h-5 w-5" />
                  Ver carros cerca
                </Button>
              </Link>
              <Link to="/registro" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 border-2 border-white text-white hover:bg-white hover:text-foreground font-semibold transition-all hover:scale-105">
                  <Users className="mr-2 h-5 w-5" />
                  Unirme gratis
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-8 sm:pt-12 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all hover:scale-105 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent">{stat.number}</div>
                  <div className="text-xs sm:text-sm text-white/80 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section - Rediseñado */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-background to-secondary/30">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              ¿Por qué elegir AndaYa?
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Más que un servicio de alquiler, somos tu comunidad de confianza
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-scale-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <CardContent className="p-6 sm:p-8 relative">
                  <div className={`inline-flex p-3 sm:p-4 rounded-2xl bg-gradient-to-br ${feature.color} mb-4 sm:mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works - Rediseñado */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Súper fácil en 4 pasos
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Tu próximo viaje está a solo minutos de distancia
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="relative group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[calc(50%+40px)] w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
                
                <Card className="relative overflow-hidden border-2 hover:border-primary transition-all hover:shadow-xl h-full">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <div className="relative inline-flex mb-4 sm:mb-6">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                      <div className="relative inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 group-hover:scale-110 transition-transform">
                        <step.icon className="h-7 w-7 sm:h-9 sm:w-9 text-white" />
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 text-4xl sm:text-6xl font-bold text-primary/10">
                      {index + 1}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{step.title}</h3>
                    <p className="text-muted-foreground text-sm sm:text-base">{step.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Rediseñado */}
      <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-[hsl(var(--brand-blue))]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="container relative px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center text-white space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 animate-fade-in">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Únete en menos de 2 minutos</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold animate-scale-in">
              ¿Listo para tu próxima aventura?
            </h2>
            
            <p className="text-lg sm:text-xl text-white/90 animate-fade-in">
              Más de 15,000 usuarios ya están disfrutando de AndaYa.
              <br className="hidden sm:block" />
              ¡Es tu turno de experimentar la libertad!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-scale-in">
              <Link to="/registro" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 bg-accent hover:bg-accent/90 text-foreground font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                >
                  Crear cuenta gratis
                </Button>
              </Link>
              <Link to="/explorar" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 bg-white/10 border-2 border-white text-white hover:bg-white hover:text-foreground font-semibold transition-all hover:scale-105"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Explorar carros
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
