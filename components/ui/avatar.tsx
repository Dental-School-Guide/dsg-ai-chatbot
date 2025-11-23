import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative inline-flex h-8 w-8 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-[--panel-3] text-[--text] ring-1 ring-[--panel-border]",
        className
      )}
    >
      {children}
    </div>
  );
}
