import { Suspense } from "react";
import { WidgetContent } from "@/components/widget-content";

export default function WidgetPage() {
  return (
    <div className="h-screen w-full overflow-hidden bg-[--dsg-bg]" style={{
      backgroundImage: 'radial-gradient(140% 120% at 18% 0%, rgba(0, 0, 0, 0.163), transparent 58%), radial-gradient(120% 140% at 86% -18%, rgb(8, 1, 10), transparent 55%), linear-gradient(165deg, #04070f 0%, #0a101c 32%, #050912 100%)',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat'
    }}>
      <Suspense fallback={
        <div className="h-full w-full overflow-hidden text-[--dsg-text] p-2 md:p-4">
          <div className="dsg-outer-frame-bg border flex h-full w-full gap-4 rounded-3xl p-[1px] shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]">
            <div className="flex h-full w-full gap-4 rounded-3xl bg-[--dsg-bg-alt] p-2 backdrop-blur-sm items-center justify-center">
              <div className="text-[--dsg-text]">Loading...</div>
            </div>
          </div>
        </div>
      }>
        <WidgetContent />
      </Suspense>
    </div>
  );
}
