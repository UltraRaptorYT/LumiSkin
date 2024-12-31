import { rewrite } from "@vercel/edge";

export const config = {
  matcher: "/api/:path*",
};

export default function middleware(request: Request) {
  const url = new URL(request.url);
  console.log(url);
  if (url.pathname.startsWith("/api")) {
    return rewrite(new URL("/api-2", request.url));
  }
}
