import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            "bg-[#4A3728] text-white hover:bg-[#3A2A1E] shadow-sm dark:bg-[#E8DCC4] dark:text-[#4A3728] dark:hover:bg-white": variant === "default",
            "bg-amber-100/50 text-amber-900 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-100 dark:hover:bg-amber-900/50": variant === "secondary",
            "border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 shadow-sm dark:border-stone-800 dark:bg-stone-900/50 dark:hover:bg-stone-800 dark:text-stone-300": variant === "outline",
            "hover:bg-stone-100 text-stone-600 dark:hover:bg-stone-800 dark:text-stone-400": variant === "ghost",
            "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40": variant === "destructive",
            "h-11 px-6 py-2": size === "default",
            "h-9 px-3 text-xs": size === "sm",
            "h-12 px-8 text-base": size === "lg",
            "h-11 w-11": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
