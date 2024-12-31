import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageName = searchParams.get("q");
  return NextResponse.json({ image: imageName }, { status: 200 });
}
