"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 🔑 Sync session cookies server-side (clear them)
      console.log('Logout successful, syncing session cookies...');
      await fetch("/api/auth/callback", {
        method: "POST",
        credentials: "include",
      });

      console.log('Session cleared, redirecting to login page...');
      window.location.href = "/auth/login";
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return <Button onClick={logout}>Logout</Button>;
}
