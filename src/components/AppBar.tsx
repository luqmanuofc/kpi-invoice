import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NavigationAppBar() {
  const navigate = useNavigate();

  return (
    <AppBar position="static" sx={{ backgroundColor: "#373b75" }}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, textAlign: "left" }}
        >
          KPI
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            color="inherit"
            onClick={() => navigate("/")}
            sx={{ textTransform: "none" }}
          >
            Create Invoice
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate("/invoices")}
            sx={{ textTransform: "none" }}
          >
            Invoices
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate("/buyer")}
            sx={{ textTransform: "none" }}
          >
            Buyers
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
