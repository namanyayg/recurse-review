export const config = {
  matcher: '/:slug*'
};

import { auth } from "./app/auth"
 
export default auth((req) => {
  if (!req.auth && !req.nextUrl.pathname.includes("/api/auth")) {
    const newUrl = new URL("/api/auth/signin", req.nextUrl.origin)
    return Response.redirect(newUrl)
  }
})
