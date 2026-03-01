"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <button
      onClick={handleSignOut}
      style={{
        background: 'none', border: 'none', padding: 0,
        fontFamily: 'var(--font-dm-sans)',
        fontSize: '14px', color: 'var(--coral)',
        opacity: 0.7, cursor: 'pointer',
        textAlign: 'center', width: '100%',
      }}
    >
      Sign out
    </button>
  );
}
