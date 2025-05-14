import type { NextAuthConfig } from 'next-auth';
 
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnTrading = nextUrl.pathname.startsWith('/trade');
      if (isOnTrading) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        // 判断 url 中是否包含 callbackUrl
        if (nextUrl.searchParams.has('callbackUrl')) {
          return Response.redirect(new URL(nextUrl.searchParams.get('callbackUrl') as string, nextUrl));
        } else {
          return true;
        }
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;