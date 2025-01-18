// hooks/useVendorStatus.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useVendorStatus(userId?: string) {
  const queryClient = useQueryClient();

  // Query for fetching vendor status
  const {
    data: isVendor,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["vendorStatus", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("user_preferences")
        .select("is_vendor")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data?.is_vendor ?? null;
    },
    // Don't fetch if we don't have a userId
    enabled: !!userId,
  });

  // Mutation for updating vendor status
  const mutation = useMutation({
    mutationFn: async (newStatus: boolean) => {
      if (!userId) throw new Error("User ID is required");

      // First delete listings/reaches
      const { error: deleteError } = await supabase.rpc(
        "delete_all_vendor_listings",
        {
          vendor_id: userId,
          is_becoming_vendor: newStatus,
        }
      );

      if (deleteError) throw deleteError;

      // Then update vendor status
      const { error: updateError } = await supabase
        .from("user_preferences")
        .update({ is_vendor: newStatus })
        .eq("id", userId);

      if (updateError) throw updateError;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      // Optimistically update the cache
      queryClient.setQueryData(["vendorStatus", userId], newStatus);

      // Show success message
      toast.success(
        newStatus
          ? "Successfully switched to vendor account"
          : "Successfully switched to non-vendor account"
      );
    },
    onError: (error) => {
      // Show error message
      toast.error(
        error instanceof Error ? error.message : "Failed to update account type"
      );

      // Invalidate the query to refetch the correct state
      queryClient.invalidateQueries({ queryKey: ["vendorStatus", userId] });
    },
  });

  return {
    isVendor,
    isLoading,
    error,
    updateVendorStatus: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
