import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  const url = new URL(context.url);
  
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf|otf|json|xml|txt)$/)) {
    return next();
  }

  if (url.pathname === "/login") {
    return next();
  }

  const cookie = context.request.headers.get("cookie") || "";
  const isLoggedIn = cookie.includes("cf_auth=1");

  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", context.url));
  }

  return next();
});