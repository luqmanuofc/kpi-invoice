import { useEffect, useState } from "react";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getInvoiceStatusLogs, type InvoiceStatusLog } from "../api/invoices";

interface StatusLogsModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber?: string;
}

export default function StatusLogsModal({
  open,
  onClose,
  invoiceId,
  invoiceNumber,
}: StatusLogsModalProps) {
  const [logs, setLogs] = useState<InvoiceStatusLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && invoiceId) {
      fetchLogs();
    }
  }, [open, invoiceId]);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInvoiceStatusLogs(invoiceId);
      setLogs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load status logs");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Status Change History</DialogTitle>
          {invoiceNumber && (
            <p className="text-sm text-muted-foreground">
              Invoice #{invoiceNumber}
            </p>
          )}
        </DialogHeader>

        <div className="mt-4">
          {isLoading && (
            <div className="flex justify-center items-center min-h-50">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isLoading && !error && logs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                No status changes recorded yet
              </p>
            </div>
          )}

          {!isLoading && !error && logs.length > 0 && (
            <div className="space-y-3">
              {logs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(log.oldStatus)}>
                      {getStatusLabel(log.oldStatus)}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant={getStatusVariant(log.newStatus)}>
                      {getStatusLabel(log.newStatus)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(log.changedAt)}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
