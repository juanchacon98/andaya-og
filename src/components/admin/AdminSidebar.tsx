import { 
  LayoutDashboard, 
  Car, 
  Calendar, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings,
  ChevronLeft,
  Database,
  Shield,
  DollarSign
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Vehículos", url: "/admin/vehiculos", icon: Car },
  { title: "Reservas", url: "/admin/reservas", icon: Calendar },
  { title: "Usuarios", url: "/admin/usuarios", icon: Users },
  { title: "Pagos", url: "/admin/pagos", icon: CreditCard },
  { title: "Reportes", url: "/admin/reportes", icon: BarChart3 },
  { title: "Tasas FX", url: "/admin/tasas", icon: DollarSign },
  { title: "Backups", url: "/admin/backups", icon: Database },
  { title: "Auditoría", url: "/admin/auditoria", icon: Shield },
  { title: "Configuración", url: "/admin/configuracion", icon: Settings },
];

export function AdminSidebar() {
  const { open, toggleSidebar } = useSidebar();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar" collapsible="icon">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {open && (
          <h2 className="text-lg font-semibold text-sidebar-foreground">AndaYa Admin</h2>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "rounded-lg p-2 hover:bg-sidebar-accent transition-colors text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-ring",
            !open && "mx-auto"
          )}
          aria-label={open ? "Colapsar menú" : "Expandir menú"}
        >
          <ChevronLeft className={cn("h-5 w-5 transition-transform", !open && "rotate-180")} />
        </button>
      </div>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className={cn("text-muted-foreground text-xs uppercase tracking-wider", !open && "hidden")}>
            Menú Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                          "focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2 focus:ring-offset-sidebar",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        )
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
