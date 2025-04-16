import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DatePicker, DateInput, DateSegment, Button, Group, Popover, Dialog, Calendar, CalendarGrid, CalendarCell, Heading, Label } from "react-aria-components"
import { getLocalTimeZone, today } from "@internationalized/date"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// API simplifiée : value (Date), onChange (Date), range (booléen), placeholder, className
export function Calendar({
  value,
  onChange,
  range = false,
  placeholder = "Choisir une date",
  className,
  ...props
}: {
  value?: Date | { start: Date; end: Date }
  onChange?: (date: Date | { start: Date; end: Date }) => void
  range?: boolean
  placeholder?: string
  className?: string
}) {
  // Conversion Date JS <-> DateValue (React Aria)
  const toDateValue = (date: Date | null) =>
    date
      ? {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
        }
      : undefined
  const fromDateValue = (dateValue: any) =>
    dateValue && dateValue.year
      ? new Date(dateValue.year, dateValue.month - 1, dateValue.day)
      : null

  // Support single/range
  const [selected, setSelected] = React.useState<any>(
    value
      ? range
        ? {
            start: toDateValue((value as any).start),
            end: toDateValue((value as any).end),
          }
        : toDateValue(value as Date)
      : undefined
  )

  React.useEffect(() => {
    if (onChange) {
      if (range && selected?.start && selected?.end) {
        onChange({
          start: fromDateValue(selected.start),
          end: fromDateValue(selected.end),
        })
      } else if (!range && selected) {
        onChange(fromDateValue(selected))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  return (
    <DatePicker
      value={selected}
      onChange={setSelected}
      granularity="day"
      locale="fr-FR"
      isDateUnavailable={() => false}
      className={cn("w-full", className)}
      {...props}
    >
      <Label className="mb-1 text-sm font-medium">{placeholder}</Label>
      <Group className="flex items-center gap-2 border rounded-lg px-2 py-1 bg-background">
        <DateInput className="flex gap-1">
          {(segment) => <DateSegment segment={segment} className="px-1" />}
        </DateInput>
        <Button className="p-1 rounded hover:bg-accent" aria-label="Ouvrir le calendrier">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </Group>
      <Popover className="z-50">
        <Dialog className="bg-background rounded-lg shadow p-4">
          <Calendar className="w-full">
            <header className="flex items-center justify-between mb-2">
              <Button slot="previous" className="p-1 rounded hover:bg-accent">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Heading className="font-semibold text-primary" />
              <Button slot="next" className="p-1 rounded hover:bg-accent">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </header>
            <CalendarGrid>
              {(date) => <CalendarCell date={date} className="rounded hover:bg-accent aria-selected:bg-primary aria-selected:text-white" />}
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </DatePicker>
  )
}
