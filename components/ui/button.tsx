import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-[#0B1F33] text-white shadow-sm hover:bg-[#2563EB]",
        brand:
          "bg-[#2563EB] text-white shadow-sm hover:bg-blue-600 shadow-blue-500/20",
        destructive:
          "bg-rose-500 text-white shadow-xs hover:bg-rose-600",
        outline:
          "border border-slate-200 bg-white text-[#0B1F33] hover:bg-slate-50 hover:text-[#2563EB]",
        secondary:
          "bg-slate-100 text-[#0B1F33] hover:bg-slate-200",
        ghost: "hover:bg-slate-100 hover:text-[#0B1F33]",
        link: "text-[#2563EB] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
