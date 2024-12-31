import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "LumiSkin",
  description: "AI Powered Skin Analyser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main className="fullHeight bg-white dark:bg-[#080c15] flex dark:text-white text-black w-full">
          <div className="grow w-full">
            {children}
            <Toaster richColors />
          </div>
        </main>
      </body>
    </html>
  );
}
