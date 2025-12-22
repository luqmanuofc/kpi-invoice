import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HistoryIcon from "@mui/icons-material/History";
import ArchiveIcon from "@mui/icons-material/Archive";
import type { Invoice } from "../api/invoices";

interface InvoiceActionsMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onMenuAction: (
    action: "view" | "duplicate" | "logs" | "archive",
    invoices: Invoice[]
  ) => void;
  invoices: Invoice[];
}

export default function InvoiceActionsMenu({
  anchorEl,
  onClose,
  onMenuAction,
  invoices,
}: InvoiceActionsMenuProps) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      <MenuItem onClick={() => onMenuAction("view", invoices)}>
        <ListItemIcon>
          <VisibilityIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>View Invoice</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => onMenuAction("duplicate", invoices)}>
        <ListItemIcon>
          <ContentCopyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Duplicate Invoice</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => onMenuAction("logs", invoices)}>
        <ListItemIcon>
          <HistoryIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>View Logs</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => onMenuAction("archive", invoices)}>
        <ListItemIcon>
          <ArchiveIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Archive Invoice</ListItemText>
      </MenuItem>
    </Menu>
  );
}
