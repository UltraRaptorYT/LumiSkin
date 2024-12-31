import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageName = searchParams.get("q");

  if (!imageName) {
    return NextResponse.json({ error: "Invalid Name" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(
        imageName
      )}&api_key=${process.env.SERPAPI_API_KEY}`
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 500 }
      );
    }
    const data = await response.json();
    const result = data["images_results"].filter((e: any) => e["is_product"]);
    console.log(result);
    return NextResponse.json(
      {
        image: result[0]["original"],
        url: result[0]["link"],
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching image" + error },
      { status: 500 }
    );
  }
}
