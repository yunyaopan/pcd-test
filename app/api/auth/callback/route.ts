import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST() {
  // Pass request/response to Supabase so it can manage cookies
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []; // middleware will handle initial cookies
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // This ensures session is written into cookies
  const { data: { session }, error } = await supabase.auth.getSession();

  return NextResponse.json({ session, error }, { headers: response.headers });
}
