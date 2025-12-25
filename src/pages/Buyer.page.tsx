import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import BuyerDrawer from "../components/BuyerDrawer";
import { useBuyers } from "../hooks/useBuyers";

export default function BuyerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: buyers = [], isLoading, error, refetch } = useBuyers();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | undefined>();

  // Handle URL-based drawer state
  useEffect(() => {
    const path = location.pathname;

    if (path === "/buyer/create") {
      setDrawerMode("create");
      setSelectedBuyerId(undefined);
      setDrawerOpen(true);
    } else if (path.match(/^\/buyer\/([^/]+)\/edit$/)) {
      const buyerId = path.split("/")[2];
      setDrawerMode("edit");
      setSelectedBuyerId(buyerId);
      setDrawerOpen(true);
    } else if (path === "/buyer" || path === "/buyer/") {
      setDrawerOpen(false);
    }
  }, [location.pathname]);

  const handleCreateClick = () => {
    navigate("/buyer/create");
  };

  const handleEditClick = (buyerId: string) => {
    navigate(`/buyer/${buyerId}/edit`);
  };

  const handleDrawerClose = () => {
    navigate("/buyer");
  };

  const handleDrawerSuccess = () => {
    refetch();
  };

  const handleViewInvoicesClick = (buyerId: string) => {
    navigate(`/invoices?buyerId=${buyerId}`);
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div style={{ margin: "2rem" }}>
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignContent={"left"}
        p={1}
      >
        <Typography
          variant="h6"
          textAlign={"left"}
          fontWeight={400}
          sx={{ mb: 3 }}
        >
          Buyers
        </Typography>
        <div>
          {" "}
          <Button variant="outlined" size="small" onClick={handleCreateClick}>
            Create
          </Button>
        </div>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error instanceof Error ? error.message : "Failed to load buyers"}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 3,
        }}
      >
        {buyers.map((buyer) => (
          <Card
            key={buyer.id}
            sx={{
              width: "100%",
              borderRadius: 2,
              transition: "all 0.3s ease",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              bgcolor: "grey.50",
              border: "1px solid",
              borderColor: "grey.200",
              "&:hover": {
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                transform: "translateY(-4px)",
                bgcolor: "background.paper",
              },
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="div" gutterBottom>
                {buyer.name}
              </Typography>
              <Typography
                variant="body2"
                align="left"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                <strong>Address:</strong> {buyer.address}
              </Typography>
              <Typography
                variant="body2"
                align="left"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                <strong>GSTIN:</strong> {buyer.gstin || ""}
              </Typography>
              <Typography variant="body2" align="left" color="text.secondary">
                <strong>Phone:</strong> {buyer.phone || ""}
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end", p: 2, pt: 0 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleEditClick(buyer.id)}
              >
                Edit
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={() => handleViewInvoicesClick(buyer.id)}
              >
                View Invoices
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      <BuyerDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        mode={drawerMode}
        buyerId={selectedBuyerId}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
}
