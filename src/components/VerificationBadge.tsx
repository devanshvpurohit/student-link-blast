import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

interface VerificationBadgeProps {
  status: "unverified" | "pending" | "verified";
  size?: "sm" | "default";
}

export const VerificationBadge = ({ status, size = "default" }: VerificationBadgeProps) => {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  
  if (status === "verified") {
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle2 className={iconSize} />
        Verified
      </Badge>
    );
  }
  
  if (status === "pending") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className={iconSize} />
        Pending
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="gap-1">
      <XCircle className={iconSize} />
      Unverified
    </Badge>
  );
};
