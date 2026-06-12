import { useCallback, useMemo, useRef } from "react";
import { Printer } from "lucide-react";
import { Screen, Btn, NavHeader } from "./ui";

interface Props {
  photoUrls: string[];
  onBack: () => void;
  onPrint: () => void;
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function getBoothPrintHtml(photoUrls: string[]) {
  const tiles = photoUrls
    .map(
      (url) => `
        <div class="photo">
          <img src="${escapeAttribute(url)}" alt="">
        </div>
      `
    )
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Photo Booth Print</title>
    <style>
      @page {
        size: A5 portrait;
        margin: 0;
      }

      html,
      body {
        width: 148mm;
        height: 210mm;
        margin: 0;
        padding: 0;
        background: white;
      }

      * {
        box-sizing: border-box;
      }

      body {
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        font-family: Arial, sans-serif;
      }

      .sheet {
        width: 148mm;
        height: 210mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5mm;
        background: white;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .photo {
        width: 104mm;
        height: 56mm;
        overflow: hidden;
        border: 1.5mm solid white;
        box-shadow: 0 0 0 0.3mm #d1d5db;
        background: #f8fafc;
      }

      .photo img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center center;
      }
    </style>
  </head>
  <body>
    <main class="sheet">${tiles}</main>
    <script>
      window.addEventListener("load", function () {
        setTimeout(function () {
          window.focus();
          window.print();
        }, 250);
      });
    </script>
  </body>
</html>`;
}

export function PhotoBoothPrintScreen({ photoUrls, onBack, onPrint }: Props) {
  const printStartedRef = useRef(false);

  const finishPrint = useCallback(() => {
    if (!printStartedRef.current) return;
    printStartedRef.current = false;
    onPrint();
  }, [onPrint]);

  const handlePrint = useCallback(() => {
    if (typeof window === "undefined") {
      onPrint();
      return;
    }

    printStartedRef.current = true;
    let finished = false;
    const printFrame = document.createElement("iframe");

    const finishOnce = () => {
      if (finished) return;
      finished = true;
      printFrame.remove();
      finishPrint();
    };

    printFrame.setAttribute("title", "Photo booth print sheet");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    printFrame.style.opacity = "0";
    printFrame.style.pointerEvents = "none";
    printFrame.srcdoc = getBoothPrintHtml(photoUrls);

    printFrame.onload = () => {
      const printWindow = printFrame.contentWindow;
      if (!printWindow) {
        finishOnce();
        return;
      }

      printWindow.addEventListener("afterprint", finishOnce, { once: true });
      printWindow.focus();
      printWindow.print();

      window.setTimeout(() => {
        if (printStartedRef.current) {
          finishOnce();
        }
      }, 60000);
    };

    document.body.appendChild(printFrame);
  }, [finishPrint, onPrint, photoUrls]);

  const previews = useMemo(() => photoUrls.slice(0, 3), [photoUrls]);

  return (
    <Screen>
      <NavHeader onBack={onBack} title="Photo Booth Print" step={4} totalSteps={5} />

      <div className="flex-1 flex flex-col items-center px-4 py-6 gap-4 overflow-hidden">
        <div className="flex items-center gap-4 bg-white rounded-xl border border-[#E2E8F0] px-4 py-2.5 shadow-sm text-sm">
          <span className="text-[#64748B]">A5 Photo Paper</span>
          <span className="w-px h-4 bg-[#E2E8F0]" />
          <span className="font-semibold text-[#2563EB]">3-photo booth sheet</span>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center">
          <div className="h-[525px] w-[370px] bg-white border border-[#CBD5E1] shadow-2xl flex flex-col items-center justify-center gap-3">
            {previews.map((url, index) => (
              <div key={`${url}-${index}`} className="h-[140px] w-[260px] overflow-hidden border-4 border-white shadow ring-1 ring-[#CBD5E1] bg-[#F8FAFC]">
                <img src={url} alt={`Photo booth shot ${index + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 w-full max-w-md">
          <Btn variant="secondary" onClick={onBack} className="flex-1">
            Back
          </Btn>
          <Btn onClick={handlePrint} className="flex-1">
            <Printer size={18} />
            Print
          </Btn>
        </div>
      </div>
    </Screen>
  );
}
