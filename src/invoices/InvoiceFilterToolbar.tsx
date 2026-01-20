import { useState, useEffect } from "react";
import { useBuyers } from "../hooks/useBuyers";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BuyerSelect } from "@/invoice-form/BuyerSelect";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBox from "@/components/SearchBox";

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
  initialFilterType?: "invoiceNumber" | "buyer";
}

export default function InvoiceFilterToolbar({
  filters,
  onFiltersChange,
  initialFilterType = "invoiceNumber",
}: InvoiceFilterToolbarProps) {
  const [filterType, setFilterType] = useState<"invoiceNumber" | "buyer">(
    initialFilterType
  );
  const { data: buyers = [] } = useBuyers();
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

  const handleFilterTypeChange = (type: "invoiceNumber" | "buyer") => {
    setFilterType(type);

    // Clear the opposite filter when switching types
    if (type === "invoiceNumber" && filters.buyerId) {
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
    <div className="flex gap-4 items-start flex-wrap">
      <div className="flex gap-2 items-center flex-col sm:flex-row w-full sm:w-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between sm:w-35 p-2"
            >
              {filterType === "invoiceNumber" ? "Invoice Number" : "Buyer"}
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => handleFilterTypeChange("invoiceNumber")}
            >
              Invoice Number
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterTypeChange("buyer")}>
              Buyer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {filterType === "invoiceNumber" && (
          <SearchBox
            placeholder="Search by invoice number..."
            value={localInvoiceNumber}
            onChange={setLocalInvoiceNumber}
          />
        )}

        {filterType === "buyer" && (
          <div className="w-full sm:w-70">
            <BuyerSelect
              value={buyers.find((b) => b.id === filters.buyerId) || null}
              onChange={(buyer) => handleFilterChange("buyerId", buyer.id)}
              onClear={() => handleFilterChange("buyerId", "")}
            />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 sm:ml-auto sm:self-center">
        <Checkbox
          id="archived"
          checked={filters.showArchived || false}
          onCheckedChange={(checked) =>
            onFiltersChange({
              ...filters,
              showArchived: checked === true,
            })
          }
        />
        <Label
          htmlFor="archived"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          Include Archived
        </Label>
      </div>
    </div>
  );
}
