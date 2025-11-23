'use client'

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Bot, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export function ChatHeader({ className }: { className?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [showDropdown, setShowDropdown] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get user email
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header
      className={cn(
        "flex min-h-[60px] items-center justify-between gap-4 rounded-2xl border border-[--dsg-edge] dsg-panel-gradient px-4 py-2 text-[--dsg-text] shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex flex-col sm:items-baseline sm:gap-2 overflow-hidden">
          <h1 className="dsg-gradient-text text-lg font-bold whitespace-nowrap">
            Hi I'm Eden, your AI mentor.
          </h1>
          <p className="truncate text-xs text-[--dsg-muted]">
            Ask anything about prerequisites, personal statements, DAT strategy, or interviews.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 relative shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex h-8 w-8 items-center justify-center rounded-full dsg-bubble-user border border-[--dsg-accent] text-[--dsg-accent] transition-transform hover:scale-105 cursor-pointer"
          title="User menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-[--dsg-edge] bg-[#111111] shadow-2xl z-50 overflow-hidden">
            <div className="p-4 border-b border-[--dsg-edge] bg-[--dsg-panel-2]">
              <p className="text-xs text-[--dsg-muted] mb-1">Signed in as</p>
              <p className="text-sm text-[--dsg-text] font-medium truncate">{userEmail || 'Loading...'}</p>
            </div>
            <div className="p-2 bg-[#111111]">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-[--dsg-text] hover:bg-[--dsg-panel-2] transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
