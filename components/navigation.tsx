"use client";

import { AuthButtonClient } from "@/components/auth-button-client";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-white/80 backdrop-blur-sm">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center font-semibold">
          <Link href={"/"} className="text-xl font-bold text-indigo-600">
            AI-Assisted Procurement
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/protected/templates" 
              className={`hover:text-indigo-600 transition-colors ${
                pathname?.startsWith('/protected/templates') || pathname?.startsWith('/templates') 
                  ? 'text-indigo-600 font-semibold' 
                  : 'text-gray-600'
              }`}
            >
              Templates
            </Link>
            <Link 
              href="/protected/projects" 
              className={`hover:text-indigo-600 transition-colors ${
                pathname?.startsWith('/protected/projects') || pathname?.startsWith('/projects') 
                  ? 'text-indigo-600 font-semibold' 
                  : 'text-gray-600'
              }`}
            >
              Projects
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!hasEnvVars ? null : <AuthButtonClient />}
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}
