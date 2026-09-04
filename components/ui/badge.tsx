import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#0B1F33] text-white hover:bg-[#0B1F33]/80",
        secondary:
          "border-transparent bg-slate-100 text-[#0B1F33] hover:bg-slate-200",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
        outline: "text-[#0B1F33] border-slate-200",
        brand:
          "border-blue-200 bg-blue-50 text-[#2563EB] hover:bg-blue-100",
        cyan:
          "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
