import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [open, setOpen] = useState(false);

  const handleStatusSelect = (newStatus: "pending" | "paid") => {
    if (newStatus !== status) {
      onStatusChange(invoiceId, newStatus);
    }
    setOpen(false);
  };

  const getStatusVariant = (
    statusValue: string
  ): "default" | "secondary" | "outline" => {
    switch (statusValue) {
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (status === "archived") {
    return <Badge variant="outline">Archived</Badge>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          disabled={isUpdating}
          className="inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Badge variant={getStatusVariant(status)}>
            {status === "pending" ? "Pending" : "Paid"}
          </Badge>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-2"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusSelect("pending");
            }}
            className="flex items-center rounded-md px-2 py-1.5 hover:bg-muted transition-colors text-left"
          >
            <Badge variant={getStatusVariant("pending")}>Pending</Badge>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusSelect("paid");
            }}
            className="flex items-center rounded-md px-2 py-1.5 hover:bg-muted transition-colors text-left"
          >
            <Badge variant={getStatusVariant("paid")}>Paid</Badge>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
