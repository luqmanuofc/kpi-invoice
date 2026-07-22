import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getInvoices,
  getInvoiceById,
  type GetInvoicesParams,
} from "../api/invoices";

export function invoiceQueryKey(id: string | undefined) {
  return ["invoices", "detail", id] as const;
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: invoiceQueryKey(id),
    queryFn: () => getInvoiceById(id!),
    enabled: !!id,
  });
}

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
        status: ["pending", "paid", "cheque_issued"],
      }),
    enabled: !!buyerId,
    placeholderData: keepPreviousData,
  });
}

export function invoicesListQueryKey(params: GetInvoicesParams) {
  return ["invoices", "list", params] as const;
}

export function useInvoicesList(params: GetInvoicesParams) {
  return useQuery({
    queryKey: invoicesListQueryKey(params),
    queryFn: () => getInvoices(params),
    placeholderData: keepPreviousData,
  });
}
