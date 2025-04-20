"use client" // Often needed for Tanstack Table components

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
// Import other components for rendering or actions if needed
// import { Button } from "@/components/ui/button"
// import { ArrowUpDown } from "lucide-react"

// Define the shape of our vehicle data (align with API response)
// TODO: Update this based on actual Django Vehicle model/serializer
export type Vehicle = {
  id: number | string
  license_plate: string
  brand: string
  model: string
  year: number
  owner_username: string // Assuming we get owner username (or fetch separately)
  last_mileage?: number
  // Add other fields as needed
}

// Define columns
export const columns: ColumnDef<Vehicle>[] = [
  // Select Checkbox Column
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // Data Columns (add more as needed from Vehicle type)
  {
    accessorKey: "license_plate",
    header: "Plaque", // French label
  },
  {
    accessorKey: "brand",
    header: "Marque", // French label
  },
  {
    accessorKey: "model",
    header: "Modèle", // French label
  },
  {
    accessorKey: "year",
    header: "Année", // French label
  },
  {
    accessorKey: "owner_username", // Correct field name
    header: "Propriétaire", // French label
  },
   {
    accessorKey: "last_mileage",
    header: "Dernier Kilométrage", // French label
    cell: ({ row }) => {
      const mileage = parseFloat(row.getValue("last_mileage"))
      // Format as number with space separator for thousands (French style)
      const formatted = mileage ? new Intl.NumberFormat('fr-FR').format(mileage) + " km" : "N/A";
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  // TODO: Add Actions column (Edit, Delete, View Details)
  // {
  //   id: "actions",
  //   cell: ({ row }) => {
  //     const vehicle = row.original
  //     // return <DataTableRowActions row={row} /> 
  //     return <div>Actions</div> // Placeholder
  //   },
  // },
] 