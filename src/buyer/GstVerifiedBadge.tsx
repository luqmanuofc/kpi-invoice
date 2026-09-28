import { BadgeCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";

interface GstVerifiedBadgeProps {
  gstin: string | null;
  gstVerifiedAt: string | null;
  className?: string;
}

/**
 * Shows whether a buyer's GSTIN has been confirmed against the government's
 * own data (via scripts/gstin-lookup) -- see EWAY_BILL.md. Renders nothing
 * for a buyer with no GSTIN, since verification doesn't apply to them.
 */
export default function GstVerifiedBadge({
  gstin,
  gstVerifiedAt,
  className,
}: GstVerifiedBadgeProps) {
  if (!gstin) return null;

  if (gstVerifiedAt) {
    return (
      <Badge
        variant="outline"
        className={`text-green-700 dark:text-green-500 border-green-600/30 bg-green-600/10 ${className ?? ""}`}
        title={`GST details verified ${dayjs(gstVerifiedAt).format("DD/MM/YYYY")}`}
      >
        <BadgeCheck className="h-3 w-3" />
        GST Verified
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`text-amber-700 dark:text-amber-500 border-amber-600/30 bg-amber-600/10 ${className ?? ""}`}
      title="GST details not yet verified against the government's records"
    >
      <ShieldAlert className="h-3 w-3" />
      Not Verified
    </Badge>
  );
}
