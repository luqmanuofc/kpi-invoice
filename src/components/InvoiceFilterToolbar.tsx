import {
  Box,
  TextField,
  Paper,
  Autocomplete,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { useState, useEffect } from "react";
import { useBuyers } from "../hooks/useBuyers";

export interface InvoiceFilters {
  invoiceNumber?: string;
  buyerId?: string;
  status?: "pending" | "paid" | "void" | "";
  startDate?: string;
  endDate?: string;
  showArchived?: boolean;
}

interface InvoiceFilterToolbarProps {
  filters: InvoiceFilters;
  onFiltersChange: (filters: InvoiceFilters) => void;
  initialFilterType?: "search" | "buyer";
}

export default function InvoiceFilterToolbar({
  filters,
  onFiltersChange,
  initialFilterType = "search",
}: InvoiceFilterToolbarProps) {
  const [filterType, setFilterType] = useState<"search" | "buyer">(
    initialFilterType
  );
  const { data: buyers = [], isLoading: loadingBuyers } = useBuyers();
  const [localInvoiceNumber, setLocalInvoiceNumber] = useState(
    filters.invoiceNumber || ""
  );

  // Debounce invoice number search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localInvoiceNumber !== filters.invoiceNumber) {
        onFiltersChange({
          ...filters,
          invoiceNumber: localInvoiceNumber,
        });
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localInvoiceNumber]);

  const handleFilterChange = (field: keyof InvoiceFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const handleFilterTypeChange = (type: "search" | "buyer") => {
    setFilterType(type);

    // Clear the opposite filter when switching types
    if (type === "search" && filters.buyerId) {
      onFiltersChange({
        ...filters,
        buyerId: "",
      });
    } else if (type === "buyer" && filters.invoiceNumber) {
      setLocalInvoiceNumber("");
      onFiltersChange({
        ...filters,
        invoiceNumber: "",
      });
    }
  };

  return (
    <Paper elevation={1} sx={{ mb: 2, p: 2 }}>
      <Box display="flex" gap={2} alignItems="flex-start" flexWrap="wrap">
        <Box display="flex" gap={1} alignItems="flex-start">
          <TextField
            select
            size="small"
            value={filterType}
            onChange={(e) =>
              handleFilterTypeChange(e.target.value as "search" | "buyer")
            }
            sx={{ minWidth: 120, textAlign: "left" }}
            label="Search by"
            slotProps={{
              select: {
                MenuProps: {
                  PaperProps: {
                    sx: {
                      "& .MuiMenuItem-root": {
                        justifyContent: "flex-start",
                      },
                    },
                  },
                },
              },
            }}
          >
            <MenuItem value="search">Invoice #</MenuItem>
            <MenuItem value="buyer">Buyer</MenuItem>
          </TextField>

          {filterType === "search" && (
            <TextField
              size="small"
              label="Invoice Number"
              value={localInvoiceNumber}
              onChange={(e) => setLocalInvoiceNumber(e.target.value)}
              placeholder="Search..."
              sx={{ minWidth: 250 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: localInvoiceNumber ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setLocalInvoiceNumber("")}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
          )}

          {filterType === "buyer" && (
            <Autocomplete
              options={buyers}
              getOptionLabel={(option) => option.name}
              getOptionKey={(option) => option.id}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={loadingBuyers}
              value={buyers.find((b) => b.id === filters.buyerId) || null}
              onChange={(_, value) => {
                handleFilterChange("buyerId", value?.id || "");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buyer"
                  size="small"
                  placeholder="Select buyer..."
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                      endAdornment: (
                        <>
                          {loadingBuyers ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
              sx={{ minWidth: 250 }}
            />
          )}
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={filters.showArchived || false}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  showArchived: e.target.checked,
                })
              }
              size="small"
            />
          }
          label="Include Archived"
          sx={{ ml: "auto" }}
        />
      </Box>
    </Paper>
  );
}
