import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[60px] w-full rounded-md border border-[--panel-border] bg-[--panel] px-3 py-2 text-sm text-[--text] placeholder:text-[--text-dim] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--brand]",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
