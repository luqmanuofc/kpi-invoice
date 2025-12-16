import { Drawer, Box, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import {
  createBuyer,
  updateBuyer,
  getBuyerById,
  type BuyerFormData,
} from "../api/buyers";
import BuyerForm from "./BuyerForm";

interface BuyerDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  buyerId?: string;
  onSuccess?: () => void;
}

export default function BuyerDrawer({
  open,
  onClose,
  mode,
  buyerId,
  onSuccess,
}: BuyerDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<BuyerFormData | undefined>();

  useEffect(() => {
    if (mode === "edit" && buyerId && open) {
      const fetchBuyer = async () => {
        try {
          setIsFetching(true);
          setError(null);
          const buyer = await getBuyerById(buyerId);
          setInitialData({
            name: buyer.name,
            address: buyer.address,
            gstin: buyer.gstin || "",
            phone: buyer.phone || "",
          });
        } catch (err: any) {
          setError(err.message || "Failed to load buyer");
        } finally {
          setIsFetching(false);
        }
      };

      fetchBuyer();
    } else if (mode === "create" && open) {
      // Reset form data when opening in create mode
      setInitialData(undefined);
      setError(null);
    }
  }, [mode, buyerId, open]);

  const handleSubmit = async (data: BuyerFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "create") {
        await createBuyer(data);
      } else if (mode === "edit" && buyerId) {
        await updateBuyer(buyerId, data);
      }

      // Call success callback to refresh buyer list
      if (onSuccess) {
        onSuccess();
      }

      // Close drawer on success
      onClose();
    } catch (err: any) {
      setError(
        err.message ||
          `An error occurred while ${mode === "create" ? "creating" : "updating"} the buyer`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: "500px", md: "600px" },
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6">
            {mode === "create" ? "New Buyer" : "Edit Buyer"}
          </Typography>
          <IconButton onClick={handleClose} disabled={isLoading}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflow: "auto", p: 3 }}>
          <BuyerForm
            mode={mode}
            initialData={initialData}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
          />
        </Box>
      </Box>
    </Drawer>
  );
}
