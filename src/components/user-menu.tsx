"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut } from "lucide-react";

export function UserMenu({ email, signOutAction }: { email: string; signOutAction: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = email ? email.charAt(0).toUpperCase() : "U";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-[#10b981] to-[#3b82f6] text-sm font-bold text-white shadow-sm ring-1 ring-black/5 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 border-b border-border bg-gray-50/50">
            <p className="text-sm font-medium text-gray-900 truncate" title={email}>
              {email}
            </p>
          </div>
          <div className="p-1">
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
