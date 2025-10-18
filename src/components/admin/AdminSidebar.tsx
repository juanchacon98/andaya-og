import { 
  LayoutDashboard, 
  Car, 
  Calendar, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings,
  ChevronLeft,
  Database
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
  { title: "Backups", url: "/admin/backups", icon: Database },
  { title: "Configuración", url: "/admin/configuracion", icon: Settings },
];

export function AdminSidebar() {
  const { open, toggleSidebar } = useSidebar();

  return (
    <Sidebar className="border-r border-slate-800 bg-[#0F172A]" collapsible="icon">
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        {open && (
          <h2 className="text-lg font-semibold text-white">AndaYa Admin</h2>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "rounded-lg p-2 hover:bg-slate-800/50 transition-colors text-white focus:outline-none focus:ring-2 focus:ring-slate-600",
            !open && "mx-auto"
          )}
          aria-label={open ? "Colapsar menú" : "Expandir menú"}
        >
          <ChevronLeft className={cn("h-5 w-5 transition-transform", !open && "rotate-180")} />
        </button>
      </div>

      <SidebarContent className="bg-[#0F172A]">
        <SidebarGroup>
          <SidebarGroupLabel className={cn("text-slate-400 text-xs uppercase tracking-wider", !open && "hidden")}>
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
                          "focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-[#0F172A]",
                          isActive
                            ? "bg-[#1F2937] text-white font-medium shadow-sm"
                            : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
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
