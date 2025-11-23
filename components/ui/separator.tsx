import * as React from "react";

export function Separator({ className }: { className?: string }) {
  return <div className={["h-px w-full bg-[--panel-border]", className].filter(Boolean).join(" ")} />;
}
