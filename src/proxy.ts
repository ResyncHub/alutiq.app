import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16: konwencja "proxy" (dawniej "middleware").
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Pomijamy pliki statyczne i obrazki — sesję odświeżamy dla stron i API.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
