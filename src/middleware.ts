import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Primera barrera de permisos (rápida, en el edge). Cada página y acción vuelve a
// validar contra la base de datos mediante requireUser/requireRole/assertUser.
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const url = new URL("/ingresar", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/panel?error=permiso", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/panel/:path*", "/admin/:path*"] };
