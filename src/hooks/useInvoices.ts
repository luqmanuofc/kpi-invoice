import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getInvoices } from "../api/invoices";

export function buyerInvoicesQueryKey(
  buyerId: string | undefined,
  page: number,
  pageSize: number
) {
  return ["invoices", "buyer", buyerId, page, pageSize] as const;
}

export function useBuyerInvoices(
  buyerId: string | undefined,
  page: number,
  pageSize: number
) {
  return useQuery({
    queryKey: buyerInvoicesQueryKey(buyerId, page, pageSize),
    queryFn: () =>
      getInvoices({
        buyerId: buyerId!,
        page,
        pageSize,
        status: ["pending", "paid"],
      }),
    enabled: !!buyerId,
    placeholderData: keepPreviousData,
  });
}
