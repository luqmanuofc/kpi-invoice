import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getLatestPrintJob, printInvoiceEpson } from "../api/print";
import {
  IN_FLIGHT_PRINT_STATUSES,
  type EpsonPrintJob,
} from "../schemas/printInvoice";

const POLL_INTERVAL_MS = 3000;

export function isPrintJobInFlight(status: string | undefined): boolean {
  return !!status && (IN_FLIGHT_PRINT_STATUSES as readonly string[]).includes(status);
}

export function printJobQueryKey(invoiceId: string | undefined) {
  return ["printJob", invoiceId] as const;
}

export function usePrintJob(invoiceId: string | undefined) {
  return useQuery({
    queryKey: printJobQueryKey(invoiceId),
    queryFn: () => getLatestPrintJob(invoiceId!),
    enabled: !!invoiceId,
    refetchInterval: (query) =>
      isPrintJobInFlight((query.state.data as EpsonPrintJob | null)?.status)
        ? POLL_INTERVAL_MS
        : false,
  });
}

export function usePrintInvoiceEpson(invoiceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: printInvoiceEpson,
    onSuccess: (printJob) => {
      queryClient.setQueryData(printJobQueryKey(invoiceId), printJob);
    },
  });
}
