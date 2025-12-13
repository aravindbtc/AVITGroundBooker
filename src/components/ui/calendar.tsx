
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
      
        caption: "relative flex justify-center items-center",
        caption_label: "text-sm font-semibold",
      
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
      
        table: "w-full border-collapse",
      
        head_row: "grid grid-cols-7",
        head_cell:
          "text-center text-xs font-medium text-muted-foreground",
      
        row: "grid grid-cols-7 mt-2",
      
        cell:
          "h-9 w-9 text-center text-sm relative p-0",
      
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal"
        ),
      
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary",
      
        day_today: "border border-primary",
      
        day_outside:
          "text-muted-foreground opacity-40",
      
        day_disabled:
          "text-muted-foreground opacity-30",
      
        day_hidden: "invisible",
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
