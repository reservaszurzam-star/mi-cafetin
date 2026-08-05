import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border border-stone-200/80 bg-stone-50/50 px-4 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/10 focus-visible:border-amber-500 focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50 transition-all dark:border-stone-800/80 dark:bg-stone-900/50 dark:ring-offset-stone-950 dark:placeholder:text-stone-500 dark:focus-visible:bg-stone-900 dark:focus-visible:ring-amber-500/20 dark:text-stone-100",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
