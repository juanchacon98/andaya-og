import { 
  LayoutDashboard, 
  Car, 
  Calendar, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings,
  ChevronLeft
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
  { title: "Configuración", url: "/admin/configuracion", icon: Settings },
];

export function AdminSidebar() {
  const { open, toggleSidebar } = useSidebar();

  return (
    <Sidebar className="border-r border-border bg-background" collapsible="icon">
      <div className="flex items-center justify-between p-4 border-b border-border">
        {open && (
          <h2 className="text-lg font-semibold text-foreground">AndaYa Admin</h2>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "rounded-lg p-2 hover:bg-secondary transition-colors",
            !open && "mx-auto"
          )}
        >
          <ChevronLeft className={cn("h-5 w-5 transition-transform", !open && "rotate-180")} />
        </button>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={cn(!open && "hidden")}>
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
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-secondary text-foreground"
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
