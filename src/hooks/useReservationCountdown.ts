import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import duration from "dayjs/plugin/duration";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);

interface CountdownResult {
  timeRemaining: string;
  isOverdue: boolean;
  isInGracePeriod: boolean;
  overageTime: string;
  status: "upcoming" | "active" | "grace" | "overdue" | "completed";
  percentComplete: number;
}

export function useReservationCountdown(
  endAt: string | null,
  gracePeriodMinutes: number = 30,
  status?: string
): CountdownResult {
  const [countdown, setCountdown] = useState<CountdownResult>({
    timeRemaining: "--",
    isOverdue: false,
    isInGracePeriod: false,
    overageTime: "--",
    status: "upcoming",
    percentComplete: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!endAt || status === "completed" || status === "canceled") {
      setCountdown({
        timeRemaining: "--",
        isOverdue: false,
        isInGracePeriod: false,
        overageTime: "--",
        status: "completed",
        percentComplete: 100,
      });
      return;
    }

    const calculateCountdown = () => {
      const now = dayjs.tz(new Date(), "America/Caracas");
      const endDate = dayjs.tz(endAt, "America/Caracas");
      const graceEndDate = endDate.add(gracePeriodMinutes, "minutes");

      const diffFromEnd = endDate.diff(now);
      const diffFromGrace = graceEndDate.diff(now);

      // Upcoming or active (before end_at)
      if (diffFromEnd > 0) {
        const dur = dayjs.duration(diffFromEnd);
        const days = Math.floor(dur.asDays());
        const hours = dur.hours();
        const minutes = dur.minutes();

        let timeStr = "";
        if (days > 0) {
          timeStr = `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
          timeStr = `${hours}h ${minutes}m`;
        } else {
          timeStr = `${minutes}m`;
        }

        setCountdown({
          timeRemaining: timeStr,
          isOverdue: false,
          isInGracePeriod: false,
          overageTime: "--",
          status: status === "active" ? "active" : "upcoming",
          percentComplete: 0,
        });
        return;
      }

      // In grace period (between end_at and grace_end)
      if (diffFromGrace > 0) {
        const dur = dayjs.duration(diffFromGrace);
        const minutes = Math.ceil(dur.asMinutes());

        setCountdown({
          timeRemaining: `${minutes}m de gracia`,
          isOverdue: false,
          isInGracePeriod: true,
          overageTime: "--",
          status: "grace",
          percentComplete: 0,
        });
        return;
      }

      // Overdue (past grace period)
      const overageDiff = now.diff(graceEndDate);
      const overageDur = dayjs.duration(overageDiff);
      const overageDays = Math.floor(overageDur.asDays());
      const overageHours = overageDur.hours();
      const overageMinutes = overageDur.minutes();

      let overageStr = "";
      if (overageDays > 0) {
        overageStr = `+${overageDays}d ${overageHours}h ${overageMinutes}m`;
      } else if (overageHours > 0) {
        overageStr = `+${overageHours}h ${overageMinutes}m`;
      } else {
        overageStr = `+${overageMinutes}m`;
      }

      setCountdown({
        timeRemaining: "Vencido",
        isOverdue: true,
        isInGracePeriod: false,
        overageTime: overageStr,
        status: "overdue",
        percentComplete: 100,
      });
    };

    // Initial calculation
    calculateCountdown();

    // Update every 10 seconds
    intervalRef.current = setInterval(calculateCountdown, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [endAt, gracePeriodMinutes, status]);

  return countdown;
}
