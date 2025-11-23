import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md border border-[--panel-border] bg-[--panel] px-3 text-sm text-[--text] placeholder:text-[--text-dim] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--brand]",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
