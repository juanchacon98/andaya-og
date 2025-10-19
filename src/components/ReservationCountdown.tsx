import { Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useReservationCountdown } from "@/hooks/useReservationCountdown";

interface ReservationCountdownProps {
  endAt: string;
  gracePeriodMinutes?: number;
  status?: string;
  className?: string;
  showIcon?: boolean;
}

export function ReservationCountdown({
  endAt,
  gracePeriodMinutes = 30,
  status,
  className,
  showIcon = true,
}: ReservationCountdownProps) {
  const countdown = useReservationCountdown(endAt, gracePeriodMinutes, status);

  if (countdown.status === "completed") {
    return null;
  }

  const getStatusColor = () => {
    switch (countdown.status) {
      case "overdue":
        return "destructive";
      case "grace":
        return "warning";
      case "active":
        return countdown.timeRemaining.includes("h") ? "default" : "warning";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = () => {
    if (countdown.isOverdue || countdown.isInGracePeriod) {
      return <AlertTriangle className="h-3 w-3" />;
    }
    return <Clock className="h-3 w-3" />;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant={getStatusColor()} className="flex items-center gap-1">
        {showIcon && getStatusIcon()}
        <span className="font-mono text-xs">
          {countdown.isOverdue ? countdown.overageTime : countdown.timeRemaining}
        </span>
      </Badge>
      
      {countdown.isInGracePeriod && (
        <span className="text-xs text-muted-foreground">
          Período de gracia
        </span>
      )}
      
      {countdown.isOverdue && (
        <span className="text-xs text-destructive font-medium">
          Con retraso
        </span>
      )}
    </div>
  );
}
