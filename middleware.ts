import { rewrite } from "@vercel/edge";

export default function middleware(request: Request) {
  const url = new URL(request.url);
  console.log(url);
  if (url.pathname.startsWith("/about")) {
    return rewrite(new URL("/about-2", request.url));
  }

  if (url.pathname.startsWith("/dashboard")) {
    return rewrite(new URL("/dashboard/user", request.url));
  }
}
