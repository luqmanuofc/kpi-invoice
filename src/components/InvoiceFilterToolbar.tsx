import {
  Box,
  TextField,
  Button,
  Paper,
  ButtonGroup,
  Autocomplete,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { useState, useEffect } from "react";
import { getBuyers, type Buyer } from "../api/buyers";

export interface InvoiceFilters {
  invoiceNumber?: string;
  buyerId?: string;
  status?: "pending" | "paid" | "void" | "";
  startDate?: string;
  endDate?: string;
}

interface InvoiceFilterToolbarProps {
  filters: InvoiceFilters;
  onFiltersChange: (filters: InvoiceFilters) => void;
}

export default function InvoiceFilterToolbar({
  filters,
  onFiltersChange,
}: InvoiceFilterToolbarProps) {
  const [filterType, setFilterType] = useState<"search" | "buyer">("search");
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(true);
  const [localInvoiceNumber, setLocalInvoiceNumber] = useState(
    filters.invoiceNumber || ""
  );

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const buyersData = await getBuyers();
        setBuyers(buyersData);
      } catch (error) {
        console.error("Failed to fetch buyers:", error);
      } finally {
        setLoadingBuyers(false);
      }
    };

    fetchBuyers();
  }, []);

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
      <Box
        display={"flex"}
        gap={2}
        flexDirection={"column"}
        alignItems={"center"}
        width="100%"
      >
        <ButtonGroup
          sx={{
            mb: 2,
            "& .MuiButton-root:first-of-type": {
              borderTopLeftRadius: 20,
              borderBottomLeftRadius: 20,
            },
            "& .MuiButton-root:last-of-type": {
              borderTopRightRadius: 20,
              borderBottomRightRadius: 20,
            },
          }}
          variant="outlined"
          aria-label="Filter type selector"
        >
          <Button
            sx={{ width: "125px" }}
            variant={filterType === "search" ? "contained" : "outlined"}
            onClick={() => handleFilterTypeChange("search")}
          >
            Search
          </Button>
          <Button
            sx={{ width: "125px" }}
            variant={filterType === "buyer" ? "contained" : "outlined"}
            onClick={() => handleFilterTypeChange("buyer")}
          >
            Buyer
          </Button>
        </ButtonGroup>
        <Box>
          {filterType === "search" && (
            <Box width={"100%"}>
              <TextField
                size="small"
                label="Enter Invoice Number"
                value={localInvoiceNumber}
                onChange={(e) => setLocalInvoiceNumber(e.target.value)}
                placeholder="Search..."
                sx={{ minWidth: 300 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: localInvoiceNumber ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setLocalInvoiceNumber("")}
                          edge="end"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />
            </Box>
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
                  label="Select Buyer"
                  size="small"
                  placeholder="All Buyers"
                  slotProps={{
                    input: {
                      ...params.InputProps,
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
              sx={{ minWidth: 300 }}
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
}
