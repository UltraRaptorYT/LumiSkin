import heroBG from "@/assets/herobg.webp";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function Home() {
  const [dialogState, setDialogState] = useState<number>(0);
  const dialogContent = [
    <div className="z-10 flex w-full items-center justify-center flex-col gap-10">
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
    <div className="z-10 flex w-full items-center justify-center flex-col gap-10">
      <h2 className="text-2xl">DECODE YOUR SKIN IN A FLASH</h2>
      <div></div>
    </div>,
  ];
  return (
    <div className="h-full flex flex-col items-center justify-center container mx-auto">
      <img src={heroBG} className="max-w-96 mx-auto w-full" />
      <div className="container px-4 py-2 mx-auto mt-auto">
        <h2 className="text-xl">NEW E-SKIN EXPERT</h2>
        <h3 className="text-lg">OUR MOST ADVANCED ONLINE SKIN ANALYSIS</h3>
        <p className="my-4">
          You are one picture away from revealing your skin’s true potential.
          Get your personalized skincare solution and expert tips with our A.I.
          powered online skin analysis tool.
        </p>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant={"default"} className="w-full" size={"lg"}>
              START NOW
            </Button>
          </DialogTrigger>
          <DialogContent
            className={cn(
              "h-full bg-overlay bg-center bg-cover text-white flex",
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
