import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type SelectableStatus = "pending" | "paid" | "cheque_issued";

interface InvoiceStatusChipProps {
  status: SelectableStatus | "archived";
  invoiceId: string;
  isUpdating?: boolean;
  onStatusChange: (invoiceId: string, newStatus: SelectableStatus) => void;
}

const STATUS_OPTIONS: Array<{
  value: SelectableStatus;
  label: string;
  variant: "default" | "secondary" | "outline";
}> = [
  { value: "pending", label: "Pending", variant: "secondary" },
  { value: "cheque_issued", label: "Cheque Issued", variant: "outline" },
  { value: "paid", label: "Paid", variant: "default" },
];

export default function InvoiceStatusChip({
  status,
  invoiceId,
  isUpdating = false,
  onStatusChange,
}: InvoiceStatusChipProps) {
  const [open, setOpen] = useState(false);

  const handleStatusSelect = (newStatus: SelectableStatus) => {
    if (newStatus !== status) {
      onStatusChange(invoiceId, newStatus);
    }
    setOpen(false);
  };

  if (status === "archived") {
    return <Badge variant="outline">Archived</Badge>;
  }

  const current = STATUS_OPTIONS.find((option) => option.value === status);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          disabled={isUpdating}
          className="inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Badge variant={current?.variant}>{current?.label}</Badge>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-2"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusSelect(option.value);
              }}
              className="flex items-center rounded-md px-2 py-1.5 hover:bg-muted transition-colors text-left"
            >
              <Badge variant={option.variant}>{option.label}</Badge>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
