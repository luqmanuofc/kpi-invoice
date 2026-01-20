import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Switch } from "@/components/ui/switch";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import {
  Moon,
  Sun,
  PlusIcon,
  ChartLineIcon,
  Users,
  Package,
  MoreHorizontal,
  LogOut,
  FileIcon,
  RotateCw,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function NavigationAppBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const isLoginPage = location.pathname === "/login";

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: ChartLineIcon },
    { label: "Invoices", path: "/invoices", icon: FileIcon },
    { label: "Create", path: "/", icon: PlusIcon },
    { label: "Buyers", path: "/buyer", icon: Users },
    { label: "Products", path: "/products", icon: Package },
  ];

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
    setMoreMenuOpen(false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (isLoginPage) {
    return null;
  }

  return (
    <>
      {/* Desktop Navigation - Top Bar */}
      <div className="hidden md:block border-b">
        <div className="flex h-16 items-center px-4">
          <NavigationMenu className="flex-1">
            <NavigationMenuList>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavigationMenuItem key={item.path}>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        isActive && "bg-muted font-bold"
                      )}
                      onClick={() => navigate(item.path)}
                      active={isActive}
                    >
                      {item.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-4 ml-auto">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={toggleTheme}
            >
              <Sun className="h-4 w-4" />
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
              />
              <Moon className="h-4 w-4" />
            </div>
            <button
              onClick={handleRefresh}
              className="text-sm font-medium hover:underline cursor-pointer flex items-center gap-1"
            >
              <RotateCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="text-sm font-medium hover:underline cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50 pb-4">
        <div className="flex items-center justify-around h-16 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] leading-tight">{item.label}</span>
              </button>
            );
          })}

          {/* More Menu */}
          <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-muted-foreground">
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-[10px] leading-tight">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto pb-6 px-3">
              <SheetHeader>
                <SheetTitle>More Options</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? (
                      <Moon className="h-5 w-5" />
                    ) : (
                      <Sun className="h-5 w-5" />
                    )}
                    <span className="text-sm font-medium">
                      {theme === "dark" ? "Dark" : "Light"} Mode
                    </span>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={toggleTheme}
                  />
                </div>
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-3 w-full py-3 border-b text-sm font-medium"
                >
                  <RotateCw className="h-5 w-5" />
                  Refresh App
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full py-3 text-sm font-medium text-destructive"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
