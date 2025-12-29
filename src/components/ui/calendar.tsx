"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<"div"> & {
  // Keeping props for API compatibility, even if unused in placeholder
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  mode?: "single";
};

function Calendar({
  className,
  ...props
}: CalendarProps) {
  return (
    <div
      className={cn("p-3 border rounded-md bg-muted/20 text-center", className)}
      {...props}
    >
        <p className="text-sm text-muted-foreground">
            Calendar component is temporarily unavailable.
        </p>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
