import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "secondary"
    | "ghost"
    | "outline"
    | "destructive"
    | "soft"
    | "chip";
  size?: "sm" | "md" | "lg" | "icon";
}

const base =
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 rounded-md";

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
  icon: "h-10 w-10",
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "rounded-full border border-[rgba(255,217,149,0.35)] bg-[linear-gradient(135deg,#ffd995,#f2b94b)] px-6 text-[#1a1206] shadow-[0_18px_40px_-24px_rgba(255,217,149,0.85)] hover:brightness-105",
  secondary:
    "rounded-xl border border-[rgba(159,136,255,0.2)] bg-[linear-gradient(145deg,rgba(28,36,57,0.94),rgba(16,23,38,0.94))] text-[--text] shadow-[0_18px_45px_-35px_rgba(118,92,255,0.55)] hover:shadow-[0_24px_60px_-34px_rgba(118,92,255,0.65)]",
  outline:
    "border border-[rgba(159,136,255,0.28)] bg-transparent text-[--text] hover:bg-[rgba(27,36,55,0.4)]",
  ghost:
    "bg-transparent text-[--text] hover:bg-[rgba(20,28,43,0.45)]",
  destructive:
    "rounded-full bg-red-600 text-white hover:bg-red-700",
  soft:
    "rounded-xl border border-[rgba(255,217,149,0.16)] bg-[rgba(23,31,48,0.85)] text-[--text] hover:bg-[rgba(29,39,60,0.9)]",
  chip:
    "pill-chip",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(base, sizes[size], variants[variant], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
