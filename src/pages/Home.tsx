import heroBG from "@/assets/herobg.webp";
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

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const videoConstraints = {
    width: 720,
    height: 1280,
    facingMode: "user",
  };
  /**
 *
 * 1. A daily skin care routine
2. Tips & Tricks to improve skin
3. Recommend suitable products
4. Search for videos on how to use the products
5. Give me a
 */
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
    systemInstruction: `
You are my professional AI skin care analyser. Analyse the face provided, provide the following.

1. Rate my skin score out of 10 on the following.
  1. Radiance
  2. Uneven tone
  3. Texture
  4. Wrinkles
  5. Firmness
2. Provide me with an simple yet effective skin care routine to fix my skin issues. [Format in Markdown]
3. Provide me with tips and tricks to fix my skin. [Format in Markdown]
4. Recommend me skin care products with image that will fix my skin. [Give me links]
5. Provide a tutorial on how to use the skin care product via YouTube links.

Give the output in the following JSON schema and all fields are required.
{
  "rating": {
    "radiance": {
      "score": 10,
      "explanation": ""
    },
    "unevenTone": {
      "score": 10,
      "explanation": ""
    },
    "texture": {
      "score": 10,
      "explanation": ""
    },
    "wrinkles": {
      "score": 10,
      "explanation": ""
    },
    "firmness": {
      "score": 10,
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
      "tutorial": "Must be link"
    }
  ]
}
    `,
  });

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogState, setDialogState] = useState<number>(0);
  const [file, setFile] = useState<ArrayBuffer>();
  const [imageSrc, setImageSrc] = useState<string>();
  const [genResult, setGenResult] = useState<string>();

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
        let binaryString = atob(arr[1]);

        // Create a new ArrayBuffer
        let len = binaryString.length;
        let bytes = new Uint8Array(len);

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

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      let file = await selectedFile.arrayBuffer();
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
    const result = await model.generateContent([
      {
        inlineData: {
          data: Buffer.from(file).toString("base64"),
          mimeType: "image/jpeg",
        },
      },
      "Analyse the face.",
    ]);
    console.log(result.response.text());
    setGenResult(result.response.text());
    setDialogState(4);
    return result;
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
      <img src={imageSrc} className="animate-pulse rounded-lg" />
      <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-full animate-pulse bg-black/50">
        Analysing Face...
      </p>
    </div>,
    <div className="w-full h-full flex flex-col overflow-scroll">
      <h2 className="text-2xl">YOUR RESULTS</h2>
      {genResult}
      <div className="bg-white rounded-full">Texture</div>
    </div>,
  ];
  return (
    <div className="h-full flex flex-col items-center justify-center container mx-auto">
      <img src={heroBG} className="max-w-md mx-auto w-full" />
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
              backgroundImage: `url(${heroBG})`,
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
