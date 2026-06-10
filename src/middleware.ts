import { NextRequest, NextResponse } from "next/server"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"

const ADMIN_EMAIL = "lisa.p.mcpherson@gmail.com"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const email = await runWithAmplifyServerContext({
    nextServerContext: { request, response },
    operation: async (contextSpec): Promise<string | null> => {
      try {
        const session = await fetchAuthSession(contextSpec)
        if (!session.tokens) return null
        return (session.tokens.idToken?.payload?.email as string | undefined) ?? null
      } catch {
        return null
      }
    },
  })

  if (!email) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // /my-plan is private to the admin only
  if (request.nextUrl.pathname.startsWith("/my-plan") && email.toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.redirect(new URL("/account", request.url))
  }

  return response
}

export const config = {
  matcher: ["/training-foundations/:path*", "/nutrition-foundations/:path*", "/masterclass/:path*", "/my-tracker/:path*", "/my-coaching/:path*", "/my-plan", "/account", "/account/:path*"],
}
