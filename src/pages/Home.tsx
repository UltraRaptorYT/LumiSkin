import heroBG from "@/assets/herobg.webp";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Webcam from "react-webcam";
import { Input } from "@/components/ui/input";

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const videoConstraints = {
    width: 720,
    height: 1280,
    facingMode: "user",
  };

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogState, setDialogState] = useState<number>(0);
  const [file, setFile] = useState<File>();

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const arr = imageSrc.split(",");
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch || arr.length < 2) {
          console.error("Invalid Base64 string");
          return;
        }

        const mime = mimeMatch[1]; // Extract MIME type
        const bstr = atob(arr[1]); // Decode Base64
        const n = bstr.length;
        const u8arr = new Uint8Array(n);

        for (let i = 0; i < n; i++) {
          u8arr[i] = bstr.charCodeAt(i);
        }

        const file = new File(
          [u8arr],
          new Date().toISOString() + "." + mime.split("/")[1],
          { type: mime }
        );
        setFile(file); // Set the File object
      }
    }
  }, [webcamRef]);

  useEffect(() => {
    if ([2].includes(dialogState)) {
      setDialogState(1);
    }
  }, [dialogOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      console.log(selectedFile);
    }
  };

  useEffect(() => {
    if (file) {
      console.log(file);
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
    <div className="p-3 w-full">
      <Webcam
        audio={false}
        height={1280}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={720}
        videoConstraints={videoConstraints}
        mirrored={true}
        className="rounded-lg mx-auto aspect-[300/450] md:w-full w-[300px] h-[450px]"
      />
      <button onClick={capture}>Capture photo</button>
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
            {dialogContent[dialogState]}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
