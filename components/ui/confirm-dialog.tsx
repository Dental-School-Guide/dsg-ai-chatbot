"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "text-red-400",
      iconBg: "bg-red-500/10",
      button: "border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/70",
    },
    warning: {
      icon: "text-yellow-400",
      iconBg: "bg-yellow-500/10",
      button: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500/70",
    },
    info: {
      icon: "text-blue-400",
      iconBg: "bg-blue-500/10",
      button: "border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/70",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[--dsg-edge] bg-[#111111] shadow-[0_20px_80px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-300 slide-in-from-bottom-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-[--dsg-panel-2] transition-all hover:scale-110"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4 text-[--dsg-muted]" />
        </button>

        {/* Content */}
        <div className="p-6 pt-12">
          {/* Title */}
          <h2 className="text-xl font-semibold text-[--dsg-text] mb-2">
            {title}
          </h2>

          {/* Description */}
          <p className="text-sm text-[--dsg-muted] leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[--dsg-edge] bg-transparent text-[--dsg-text] text-sm font-medium hover:bg-[--dsg-panel-2] transition-all hover:scale-105 active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg",
              styles.button
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
