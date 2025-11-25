import { Suspense } from "react";
import { HomeContent } from "@/components/home-content";
import { AuthGuard } from "@/components/auth-guard";

export default function Home() {
  return (
    <AuthGuard>
      <Suspense fallback={
        <div className="h-screen w-full overflow-hidden bg-[--bg] text-[--text]">
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-[--text-dim]">Loading...</div>
          </div>
        </div>
      }>
        <HomeContent />
      </Suspense>
    </AuthGuard>
  );
}
