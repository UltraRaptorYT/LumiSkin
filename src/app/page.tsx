"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Webcam from "react-webcam";
import { Input } from "@/components/ui/input";
import { FaCamera } from "react-icons/fa6";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Card,
  CardContent,
  CardTitle,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const videoConstraints = {
    width: 720,
    height: 1280,
    facingMode: "user",
  };
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState<boolean>();
  const [dialogState, setDialogState] = useState<number>(0);
  const [file, setFile] = useState<ArrayBuffer>();
  const [imageSrc, setImageSrc] = useState<string>();
  const [genResult, setGenResult] = useState<
    { [key: string]: any } | undefined
  >(undefined);
  const [tabValue, setTabValue] = useState<string>("results");

  const genAI = new GoogleGenerativeAI(
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
  );
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
    systemInstruction: `
You are my professional AI skin care analyser. Analyse the face provided, provide the following.

1. Rate my skin score out of 10 on the following. [Can give in 1 decimal place]
  1. Radiance
  2. Uneven tone
  3. Texture
  4. Wrinkles
  5. Firmness
2. Provide me with an simple yet effective skin care routine to fix my skin issues. [Format in Markdown]
3. Provide me with tips and tricks to fix my skin. [Format in Markdown]
4. Recommend me at least 3 luxury skin care products with image that will fix my skin. [Give me links]
5. Provide a tutorial on how to use the skin care product via YouTube links.

Give the output in the following JSON schema and all fields are required.
{
  "rating": {
    "radiance": {
      "score": 10.0,
      "explanation": ""
    },
    "unevenTone": {
      "score": 10.0,
      "explanation": ""
    },
    "texture": {
      "score": 10.0,
      "explanation": ""
    },
    "wrinkles": {
      "score": 10.0,
      "explanation": ""
    },
    "firmness": {
      "score": 10.0,
      "explanation": ""
    }
  },
  "routine": "",
  "tips": "",
  "products": [
    {
      "name": "",
      "price": "",
      "image": "Must be link",
      "url": "Must be link",
      "explanation": "",
      "tutorial": "Must be link",
    }
  ]
}
    `,
  });

  type ImageAndLinkObject = {
    image: string;
    url: string;
  };

  async function getImagesAndLink(
    imageName: string
  ): Promise<ImageAndLinkObject | undefined> {
    try {
      const response = await fetch(
        `/api/products?q=${encodeURIComponent(imageName)}`
      );
      const { image, url } = await response.json();
      console.log(image, url);
      return { image, url };
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImageSrc(imageSrc);
        const arr = imageSrc.split(",");
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch || arr.length < 2) {
          console.error("Invalid Base64 string");
          return;
        }

        console.log(imageSrc);
        const binaryString = atob(arr[1]);

        // Create a new ArrayBuffer
        const len = binaryString.length;
        const bytes = new Uint8Array(len);

        // Populate the ArrayBuffer with the decoded binary data
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        setFile(bytes.buffer);
      }
    }
  }, [webcamRef]);

  useEffect(() => {
    if ([2].includes(dialogState)) {
      setDialogState(1);
    }
  }, [dialogOpen]);

  useEffect(() => {
    if (!api) {
      return;
    }
    setCurrent(api.selectedScrollSnap() + 1);
    setCount(api.scrollSnapList().length);
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const file = await selectedFile.arrayBuffer();
      const blob = new Blob([file], { type: "image/png" });

      // Step 2: Create a URL from the Blob
      const url = URL.createObjectURL(blob);

      // Step 3: Set the URL to state
      setImageSrc(url);
      setFile(file);
      console.log(file);
    }
  };

  async function runAIAnalysis(file: ArrayBuffer) {
    try {
      // Call the AI model to generate content
      const result = await model.generateContent([
        {
          inlineData: {
            data: Buffer.from(file).toString("base64"),
            mimeType: "image/jpeg",
          },
        },
        "Analyse the face.",
      ]);

      // Parse the response
      const data = JSON.parse(result.response.text());
      console.log(data);

      // Process the products with async operations
      const updatedProducts = await Promise.all(
        data["products"].map(async (e: any) => {
          const output = await getImagesAndLink(e["name"]);
          let image, url;
          if (output) {
            image = output["image"];
            url = output["url"];
          } else {
            image = e["image"];
            url = e["url"];
          }

          console.log({ ...e, image, url }, e);
          return { ...e, image, url };
        })
      );

      // Update the data structure with the new products array
      const updatedData = {
        ...data,
        products: updatedProducts,
      };

      console.log(updatedData);

      // Update the state and return the result
      setGenResult(updatedData);
      setDialogState(4);
      return result;
    } catch (error) {
      console.error("Error in runAIAnalysis:", error);
      throw error;
    }
  }

  useEffect(() => {
    if (file) {
      setDialogState(3);
      runAIAnalysis(file);
    }
  }, [file]);

  const dialogContent = [
    <div className="flex w-full items-center justify-center flex-col gap-10 p-6">
      <div className="w-[85%]">
        <h2 className="text-lg font-bold">
          READY TO DECODE YOUR SKIN IN A FLASH?
        </h2>
        <p className="mb-6">
          Our most advanced online skin analysis tool with algorithms powerful
          enough to analyze your skin needs in a flash. Discover your
          tailor-made skincare solution and get expert advice from our beauty
          advisors.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => setDialogState(1)}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full "
      >
        START NOW
      </Button>
    </div>,
    <div className="flex w-full items-center justify-center flex-col gap-10 h-full pt-12">
      <div className="flex flex-col gap-10 px-6">
        <h2 className="text-2xl">DECODE YOUR SKIN IN A FLASH</h2>
        <ul className="list-disc list-inside">
          <li>Start with clean, make-up free skin </li>
          <li>Pull your hair back </li>
          <li>Look straight and maintain a neutral expression</li>
          <li>Stay in bright natural light</li>
        </ul>
      </div>
      <div className="mt-auto w-full bg-white text-black px-6 py-4 flex flex-col gap-3">
        <Button
          className="w-full text-base font-bold"
          size="lg"
          onClick={() => setDialogState(2)}
        >
          TAKE A SELFIE
        </Button>
        <Button
          className="w-full font-bold"
          size="lg"
          variant={"secondary"}
          asChild
        >
          <label htmlFor="picture" className="cursor-pointer">
            UPLOAD A PHOTO
          </label>
        </Button>
        <Input
          id="picture"
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>,
    <div className="p-3 w-full h-full flex items-center justify-center flex-col">
      <Webcam
        audio={false}
        height={1280}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={720}
        videoConstraints={videoConstraints}
        mirrored={true}
        className="rounded-lg mx-auto aspect-[300/450] w-full object-cover max-h-[600px]"
      />
      <div className="flex items-center justify-center py-2">
        <Button
          onClick={capture}
          size="icon"
          className="mx-auto rounded-full p-4 h-12 w-12"
        >
          <FaCamera />
        </Button>
      </div>
    </div>,
    <div className="p-3 w-full h-full flex items-center relative">
      <Image
        src={imageSrc || ""}
        className="animate-pulse rounded-lg"
        alt=""
        width={1000}
        height={1000}
      />
      <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-full animate-pulse bg-black/50">
        Analysing Face...
      </p>
    </div>,
    <div className="w-full h-full flex flex-col overflow-y-auto p-6 gap-3">
      <h2 className="text-2xl text-center">HERE ARE YOUR RESULTS</h2>
      <p>
        Discover your unique skin needs with expert advice from our beauty
        advisors and find your tailor-made skincare solution.
      </p>
      <Image
        src={imageSrc || ""}
        className="rounded-lg"
        alt=""
        width={1000}
        height={1000}
      />
      <Tabs
        defaultValue="results"
        className="p-1"
        value={tabValue}
        onValueChange={(value) => setTabValue(value)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="results">My Results</TabsTrigger>
          <TabsTrigger value="routine">My Routine</TabsTrigger>
        </TabsList>
        <TabsContent value="results">
          <div>
            <h3 className="text-xl text-center p-2">MY STRENGTHS</h3>
            <p>
              Great news! Your skin score is excellent on{" "}
              {genResult &&
                Object.entries(genResult["rating"])
                  .sort((a: any, b: any) => {
                    return (
                      parseFloat(b[1]["score"]) - parseFloat(a[1]["score"])
                    );
                  })
                  .slice(0, 5)[0][0]
                  .toUpperCase()}
              . Let&apos;s have a look at all your skin strengths.
            </p>
            <Carousel
              setApi={setApi}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full mx-auto"
            >
              <CarouselContent className="items-center">
                {genResult &&
                  Object.entries(genResult["rating"])
                    .sort((a: any, b: any) => {
                      return (
                        parseFloat(b[1]["score"]) - parseFloat(a[1]["score"])
                      );
                    })
                    .slice(0, 4)
                    .map((e: any, index) => (
                      <CarouselItem key={"carousel" + index}>
                        <div className="p-1 pt-2">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg text-green-600">
                                {e[0].toUpperCase()} {e[1]["score"]} / 10
                              </CardTitle>
                            </CardHeader>
                            <CardContent>{e[1]["explanation"]}</CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    ))}
              </CarouselContent>
              <div className="flex items-center justify-center space-x-4 p-2">
                {Array.from({ length: count }).map((_, index) => {
                  return (
                    <span
                      key={"carousel" + index}
                      onClick={() => api?.scrollTo(index)}
                      className={cn(
                        "block h-2 w-2 rounded-full",
                        current == index + 1 ? "bg-blue-600" : "bg-gray-300"
                      )}
                    ></span>
                  );
                })}
              </div>
            </Carousel>
          </div>
          <div>
            <h3 className="text-xl text-center p-2">MY PRIORITY</h3>
            <p>
              Your skin score is the lowest on{" "}
              {genResult &&
                Object.entries(genResult["rating"])
                  .sort((a: any, b: any) => {
                    return (
                      parseFloat(a[1]["score"]) - parseFloat(b[1]["score"])
                    );
                  })[0][0]
                  .toUpperCase()}
              . Let&apos;s have a look to your skin priority.
            </p>
            <div className="p-1 pt-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">
                    {genResult &&
                      Object.entries(genResult["rating"])
                        .sort((a: any, b: any) => {
                          return (
                            parseFloat(a[1]["score"]) -
                            parseFloat(b[1]["score"])
                          );
                        })[0][0]
                        .toUpperCase()}{" "}
                    {genResult &&
                      (
                        Object.entries(genResult["rating"]).sort(
                          (a: any, b: any) => {
                            return (
                              parseFloat(a[1]["score"]) -
                              parseFloat(b[1]["score"])
                            );
                          }
                        )[0][1] as any
                      )["score"]}{" "}
                    / 10
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {genResult &&
                    (
                      Object.entries(genResult["rating"]).sort(
                        (a: any, b: any) => {
                          return (
                            parseFloat(a[1]["score"]) -
                            parseFloat(b[1]["score"])
                          );
                        }
                      )[0][1] as any
                    )["explanation"]}
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="w-full flex justify-center items-center">
            <Button
              variant={"secondary"}
              className="mt-4 mx-auto"
              onClick={() => setTabValue("routine")}
            >
              DISCOVER MY ROUTINE
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="routine">
          <div className="py-3">
            <h3 className="text-xl text-center p-2">RECOMMENDED ROUTINE</h3>
            <ReactMarkdown
              className={"prose prose-invert prose-headings:text-base"}
            >
              {genResult && genResult["routine"]}
            </ReactMarkdown>
          </div>
          <div className="py-3">
            <h3 className="text-xl text-center p-2">TIPS & TRICKS</h3>
            <ReactMarkdown className={"prose prose-invert"}>
              {genResult && genResult["tips"]}
            </ReactMarkdown>
          </div>
          <div className="py-3">
            <h3 className="text-xl text-center p-2">RECOMMENDED PRODUCTS</h3>
            <div className="flex overflow-x-auto gap-4 items-center">
              {genResult &&
                genResult["products"].map((e: any, i: number) => {
                  return (
                    <Card key={"prod" + i}>
                      <CardHeader>
                        <CardTitle>{e["name"]}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Image
                          src={"/api/proxy?url=" + e["image"]}
                          alt={e["name"]}
                          className="text-xs max-w-40 max-h-36 object-contain mx-auto"
                          width={1000}
                          height={1000}
                        />
                        <p className="font-bold text-lg">{e["price"]}</p>
                      </CardContent>
                      <CardFooter className="mt-auto">
                        <div className="flex gap-3">
                          <Button
                            onClick={() => {
                              window.open(e["url"], "_blank");
                            }}
                          >
                            Buy Here
                          </Button>
                          <Button
                            variant={"secondary"}
                            onClick={() => {
                              window.open(e["tutorial"], "_blank");
                            }}
                          >
                            Watch Tutorials
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>,
  ];
  return (
    <div className="h-full flex flex-col items-center justify-center container mx-auto">
      <Image
        src="/herobg.webp"
        className="max-w-md mx-auto w-full"
        alt=""
        width={1000}
        height={1000}
      />
      <div className="container max-w-md px-4 py-2 mx-auto mt-auto">
        <h2 className="text-xl">NEW E-SKIN EXPERT</h2>
        <h3 className="text-lg">OUR MOST ADVANCED ONLINE SKIN ANALYSIS</h3>
        <p className="my-4">
          You are one picture away from revealing your skin’s true potential.
          Get your personalized skincare solution and expert tips with our A.I.
          powered online skin analysis tool.
        </p>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant={"default"} className="w-full" size={"lg"}>
              START NOW
            </Button>
          </DialogTrigger>
          <DialogContent
            className={cn(
              "h-full bg-overlay bg-center bg-cover text-white flex p-0",
              dialogState == 0 ? "items-end" : "items-center"
            )}
            style={{
              backgroundImage: dialogState != 4 ? `url("./herobg.webp")` : "",
              backgroundColor: "rgb(75,75,75,75%)",
            }}
          >
            <DialogTitle className="hidden">Skin AI Analysis</DialogTitle>
            {dialogContent[dialogState]}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
