import { Suspense } from "react";
import { HomeContent } from "@/components/home-content";

export default function Home() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full overflow-hidden bg-[--bg] text-[--text]">
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-[--text-dim]">Loading...</div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
