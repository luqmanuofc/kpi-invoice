import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBuyers,
  getBuyerById,
  createBuyer,
  updateBuyer,
  type BuyerFormData,
} from "../api/buyers";

export const BUYERS_QUERY_KEY = ["buyers"] as const;

export function useBuyers() {
  return useQuery({
    queryKey: BUYERS_QUERY_KEY,
    queryFn: getBuyers,
  });
}

export function useBuyer(id: string | undefined) {
  return useQuery({
    queryKey: [...BUYERS_QUERY_KEY, id] as const,
    queryFn: () => getBuyerById(id!),
    enabled: !!id,
  });
}

export function useCreateBuyer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BuyerFormData) => createBuyer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUYERS_QUERY_KEY });
    },
  });
}

export function useUpdateBuyer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BuyerFormData }) =>
      updateBuyer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BUYERS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...BUYERS_QUERY_KEY, variables.id],
      });
    },
  });
}
