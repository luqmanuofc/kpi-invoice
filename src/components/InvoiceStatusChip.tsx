import { useState } from "react";
import { Menu, MenuItem, Chip } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

interface InvoiceStatusChipProps {
  status: "pending" | "paid" | "archived";
  invoiceId: string;
  isUpdating?: boolean;
  onStatusChange: (invoiceId: string, newStatus: "pending" | "paid") => void;
}

export default function InvoiceStatusChip({
  status,
  invoiceId,
  isUpdating = false,
  onStatusChange,
}: InvoiceStatusChipProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusSelect = (newStatus: "pending" | "paid") => {
    if (newStatus !== status) {
      onStatusChange(invoiceId, newStatus);
    }
    handleMenuClose();
  };

  if (status === "archived") {
    return <Chip label="Archived" color="default" size="small" />;
  }

  return (
    <>
      <Chip
        label={status === "pending" ? "Pending" : "Paid"}
        color={status === "pending" ? "warning" : "success"}
        size="small"
        onClick={handleMenuOpen}
        onDelete={handleMenuOpen}
        deleteIcon={<KeyboardArrowDownIcon />}
        sx={{ cursor: "pointer" }}
        disabled={isUpdating}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <MenuItem onClick={() => handleStatusSelect("pending")}>
          <Chip label="Pending" color="warning" size="small" />
        </MenuItem>
        <MenuItem onClick={() => handleStatusSelect("paid")}>
          <Chip label="Paid" color="success" size="small" />
        </MenuItem>
      </Menu>
    </>
  );
}
