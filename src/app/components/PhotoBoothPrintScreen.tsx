import { useCallback, useMemo, useRef } from "react";
import { Printer } from "lucide-react";
import { Screen, Btn, NavHeader } from "./ui";
import type { PhotoBoothLayout, PhotoBoothTheme } from "./PhotoBoothOptionsScreen";

interface Props {
  photoUrls: string[];
  theme: PhotoBoothTheme;
  layout: PhotoBoothLayout;
  onBack: () => void;
  onPrint: () => void;
}

const themes: Record<
  PhotoBoothTheme,
  {
    label: string;
    sheetClass: string;
    printBackground: string;
    frameBackground: string;
    border: string;
    textColor: string;
  }
> = {
  classic: {
    label: "Classic",
    sheetClass: "bg-white",
    printBackground: "white",
    frameBackground: "white",
    border: "#CBD5E1",
    textColor: "#0F172A",
  },
  pastel: {
    label: "Pastel",
    sheetClass: "bg-gradient-to-br from-pink-100 via-sky-100 to-emerald-100",
    printBackground: "linear-gradient(135deg, #FCE7F3, #E0F2FE 48%, #D1FAE5)",
    frameBackground: "white",
    border: "#F9A8D4",
    textColor: "#0F172A",
  },
  bold: {
    label: "Bold",
    sheetClass: "bg-[#0F172A]",
    printBackground: "#0F172A",
    frameBackground: "#111827",
    border: "#F59E0B",
    textColor: "white",
  },
};

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function getLayoutRows(photoUrls: string[], layout: PhotoBoothLayout) {
  if (layout === "grid") {
    return `
      <div class="grid-layout">
        ${photoUrls
          .map(
            (url) => `
              <div class="photo grid-photo">
                <img src="${escapeAttribute(url)}" alt="">
              </div>
            `
          )
          .join("")}
      </div>
    `;
  }

  if (layout === "film") {
    return `
      <div class="film-strip">
        ${photoUrls
          .map(
            (url) => `
              <div class="film-frame">
                <div class="photo film-photo">
                  <img src="${escapeAttribute(url)}" alt="">
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    `;
  }

  return `
    <div class="strip-layout">
      ${photoUrls
        .map(
          (url) => `
            <div class="photo strip-photo">
              <img src="${escapeAttribute(url)}" alt="">
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function getBoothPrintHtml(photoUrls: string[], theme: PhotoBoothTheme, layout: PhotoBoothLayout) {
  const currentTheme = themes[theme];

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
        background: ${currentTheme.printBackground};
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
        padding: 8mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4mm;
        background: ${currentTheme.printBackground};
        color: ${currentTheme.textColor};
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .title {
        font-size: 10pt;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      .photo {
        overflow: hidden;
        flex: 0 0 auto;
        background: ${currentTheme.frameBackground};
        border: 1.2mm solid ${currentTheme.border};
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .photo img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center center;
      }

      .strip-layout {
        display: flex;
        flex-direction: column;
        gap: 2.5mm;
      }

      .strip-photo {
        width: 106mm;
        height: 43mm;
      }

      .grid-layout {
        display: grid;
        grid-template-columns: repeat(2, 58mm);
        gap: 3mm;
      }

      .grid-photo {
        width: 58mm;
        height: 72mm;
      }

      .film-strip {
        width: 92mm;
        padding: 3mm;
        display: flex;
        flex-direction: column;
        gap: 2mm;
        background: ${theme === "bold" ? "#020617" : "#111827"};
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .film-frame {
        padding: 1.5mm 4mm;
        background:
          repeating-linear-gradient(90deg, white 0 2mm, transparent 2mm 7mm) top / 100% 2mm no-repeat,
          repeating-linear-gradient(90deg, white 0 2mm, transparent 2mm 7mm) bottom / 100% 2mm no-repeat;
      }

      .film-photo {
        width: 76mm;
        height: 38mm;
        border-color: white;
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <div class="title">${currentTheme.label} Photo Booth</div>
      ${getLayoutRows(photoUrls, layout)}
    </main>
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

function PreviewPhoto({ url, className }: { url: string; className: string }) {
  return (
    <div className={`overflow-hidden bg-white shadow ring-1 ring-[#CBD5E1] ${className}`}>
      <img src={url} alt="" className="h-full w-full object-cover" />
    </div>
  );
}

export function PhotoBoothPrintScreen({ photoUrls, theme, layout, onBack, onPrint }: Props) {
  const printStartedRef = useRef(false);
  const currentTheme = themes[theme];

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
    printFrame.srcdoc = getBoothPrintHtml(photoUrls, theme, layout);

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
  }, [finishPrint, layout, onPrint, photoUrls, theme]);

  const previews = useMemo(() => photoUrls.slice(0, 4), [photoUrls]);

  return (
    <Screen>
      <NavHeader onBack={onBack} title="Photo Booth Print" step={4} totalSteps={5} />

      <div className="flex-1 flex flex-col items-center px-4 py-6 gap-4 overflow-hidden">
        <div className="flex items-center gap-4 bg-white rounded-xl border border-[#E2E8F0] px-4 py-2.5 shadow-sm text-sm">
          <span className="text-[#64748B]">A5 Photo Paper</span>
          <span className="w-px h-4 bg-[#E2E8F0]" />
          <span className="font-semibold text-[#2563EB] capitalize">{currentTheme.label} / {layout}</span>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center">
          <div className={`h-[525px] w-[370px] border border-[#CBD5E1] shadow-2xl flex flex-col items-center justify-center gap-3 p-5 ${currentTheme.sheetClass}`}>
            {layout === "grid" ? (
              <div className="grid grid-cols-2 gap-3">
                {previews.map((url, index) => (
                  <PreviewPhoto key={`${url}-${index}`} url={url} className="h-[155px] w-[130px] border-4 border-white" />
                ))}
              </div>
            ) : layout === "film" ? (
              <div className="flex flex-col gap-2 bg-[#111827] p-3">
                {previews.map((url, index) => (
                  <PreviewPhoto key={`${url}-${index}`} url={url} className="h-[86px] w-[220px] border-4 border-white" />
                ))}
              </div>
            ) : (
              previews.map((url, index) => (
                <PreviewPhoto key={`${url}-${index}`} url={url} className="h-[96px] w-[260px] border-4 border-white" />
              ))
            )}
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
