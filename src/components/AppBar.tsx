import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PeopleIcon from "@mui/icons-material/People";
import InventoryIcon from "@mui/icons-material/Inventory";
import { useNavigate, useLocation } from "react-router-dom";

export default function NavigationAppBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const isLoginPage = location.pathname === "/login";

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: DashboardIcon },
    { label: "Create Invoice", path: "/", icon: ReceiptIcon },
    { label: "Invoices", path: "/invoices", icon: ListAltIcon },
    { label: "Buyers", path: "/buyer", icon: PeopleIcon },
    { label: "Products", path: "/products", icon: InventoryIcon },
  ];

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  if (isLoginPage) {
    return null;
  }

  return (
    <AppBar position="static" sx={{ backgroundColor: "#373b75" }}>
      <Toolbar sx={{ justifyContent: "center", minHeight: isMobile ? "64px" : "80px", padding: isMobile ? 0 : undefined }}>
        {!isMobile && (
          <Typography
            variant="h6"
            component="div"
            sx={{ position: "absolute", left: 16 }}
          >
            KPI
          </Typography>
        )}

        <Box sx={{ display: "flex", gap: 0, width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "space-between" : "flex-start" }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => navigate(item.path)}
                sx={{
                  textTransform: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: isMobile ? 0 : "80px",
                  flex: isMobile ? 1 : "0 0 auto",
                  padding: isMobile ? "8px 4px" : "12px 16px",
                  borderLeft: isActive ? "3px solid #5B5FC7" : "3px solid transparent",
                  backgroundColor: isActive ? "rgba(91, 95, 199, 0.1)" : "transparent",
                  "&:hover": {
                    backgroundColor: isActive ? "rgba(91, 95, 199, 0.2)" : "rgba(255, 255, 255, 0.08)",
                  },
                }}
              >
                <Icon sx={{ fontSize: isMobile ? 20 : 28, mb: isMobile ? 0.25 : 0.5 }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: isMobile ? "0.6rem" : "0.75rem",
                    lineHeight: 1.2,
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </Typography>
              </Button>
            );
          })}
          <Button
            color="inherit"
            onClick={handleLogout}
            sx={{
              textTransform: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: isMobile ? 0 : "80px",
              flex: isMobile ? 1 : "0 0 auto",
              padding: isMobile ? "8px 4px" : "12px 16px",
              borderLeft: "3px solid transparent",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.08)",
              },
            }}
          >
            <LogoutIcon sx={{ fontSize: isMobile ? 20 : 28, mb: isMobile ? 0.25 : 0.5 }} />
            <Typography
              variant="caption"
              sx={{
                fontSize: isMobile ? "0.6rem" : "0.75rem",
                lineHeight: 1.2,
                textAlign: "center",
              }}
            >
              Logout
            </Typography>
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
