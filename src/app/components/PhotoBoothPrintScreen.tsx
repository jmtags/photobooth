import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { Screen, Btn, NavHeader } from "./ui";
import type { PhotoBoothLayout, PhotoBoothTheme } from "./PhotoBoothOptionsScreen";
import { createBoothPrintImage } from "../print-image";

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

function shouldUsePagePrintFallback() {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
}

function printGeneratedImageOnAndroid(imageUrl: string, background: string) {
  const escapedUrl = escapeAttribute(imageUrl);
  document.open();
  document.write(`<!doctype html>
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
        background: ${background};
      }

      * {
        box-sizing: border-box;
      }

      body {
        overflow: hidden;
      }

      img {
        display: block;
        width: 148mm;
        height: 210mm;
        object-fit: contain;
      }
    </style>
  </head>
  <body>
    <img src="${escapedUrl}" alt="">
    <script>
      window.addEventListener("afterprint", function () {
        window.setTimeout(function () {
          window.location.reload();
        }, 500);
      });
    </script>
  </body>
</html>`);
  document.close();
  window.setTimeout(() => window.print(), 100);
}

function writeAndroidPrintDocument(html: string) {
  const controls = `
    <style>
      .android-print-toolbar {
        position: fixed;
        left: 12px;
        right: 12px;
        bottom: 12px;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        border: 1px solid #DBEAFE;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18);
        color: #0F172A;
        font: 14px Arial, sans-serif;
        padding: 12px;
      }

      .android-print-toolbar strong {
        display: block;
        margin-bottom: 2px;
      }

      .android-print-toolbar span {
        color: #64748B;
        font-size: 12px;
      }

      .android-print-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }

      .android-print-actions button {
        border: 0;
        border-radius: 999px;
        font: 700 14px Arial, sans-serif;
        padding: 12px 16px;
      }

      .open-print-dialog {
        background: #2563EB;
        color: white;
      }

      .return-to-app {
        background: #F1F5F9;
        color: #0F172A;
      }

      @media print {
        .android-print-toolbar {
          display: none !important;
        }
      }
    </style>
    <script>
      window.addEventListener("afterprint", function () {
        window.setTimeout(function () {
          window.location.reload();
        }, 500);
      });
    </script>
    <div class="android-print-toolbar">
      <div>
        <strong>Print sheet is ready</strong>
        <span>Tap Print to open the Android print dialog.</span>
      </div>
      <div class="android-print-actions">
        <button class="open-print-dialog" onclick="window.print()">Print</button>
        <button class="return-to-app" onclick="window.location.reload()">Return</button>
      </div>
    </div>
  `;

  document.open();
  document.write(html.replace("window.print();", "").replace("</body>", `${controls}</body>`));
  document.close();
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
  const [mobilePrintMode, setMobilePrintMode] = useState(false);
  const [printImageUrl, setPrintImageUrl] = useState("");
  const [printImageError, setPrintImageError] = useState<string | null>(null);
  const currentTheme = themes[theme];

  const finishPrint = useCallback(() => {
    if (!printStartedRef.current) return;
    printStartedRef.current = false;
    onPrint();
  }, [onPrint]);

  useEffect(() => {
    let active = true;
    setPrintImageUrl("");
    setPrintImageError(null);

    createBoothPrintImage(photoUrls, theme, layout)
      .then((url) => {
        if (active) setPrintImageUrl(url);
      })
      .catch((err) => {
        if (active) {
          setPrintImageError(err instanceof Error ? err.message : "Could not prepare print image.");
        }
      });

    return () => {
      active = false;
    };
  }, [layout, photoUrls, theme]);

  const handlePrint = useCallback(() => {
    if (typeof window === "undefined") {
      onPrint();
      return;
    }

    if (!printImageUrl) {
      setPrintImageError("Print image is still preparing. Please try again.");
      return;
    }

    printStartedRef.current = true;
    let finished = false;

    const finishOnce = () => {
      if (finished) return;
      finished = true;
      setMobilePrintMode(false);
      finishPrint();
    };

    if (shouldUsePagePrintFallback()) {
      printGeneratedImageOnAndroid(printImageUrl, currentTheme.printBackground);
      return;
    }

    const printFrame = document.createElement("iframe");

    const finishFrameOnce = () => {
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
        finishFrameOnce();
        return;
      }

      printWindow.addEventListener("afterprint", finishFrameOnce, { once: true });
      printWindow.focus();
      printWindow.print();

      window.setTimeout(() => {
        if (printStartedRef.current) {
          finishFrameOnce();
        }
      }, 60000);
    };

    document.body.appendChild(printFrame);
  }, [finishPrint, layout, onPrint, photoUrls, printImageUrl, theme]);

  const previews = useMemo(() => photoUrls.slice(0, 4), [photoUrls]);

  const printSheetContent = (
    <>
      <div className="booth-print-title">{currentTheme.label} Photo Booth</div>
      {layout === "grid" ? (
        <div className="booth-print-grid">
          {previews.map((url, index) => (
            <div className="booth-print-photo" key={`${url}-${index}`}>
              <img src={url} alt="" />
            </div>
          ))}
        </div>
      ) : layout === "film" ? (
        <div className="booth-print-film">
          {previews.map((url, index) => (
            <div className="booth-print-film-frame" key={`${url}-${index}`}>
              <div className="booth-print-photo">
                <img src={url} alt="" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="booth-print-strip">
          {previews.map((url, index) => (
            <div className="booth-print-photo" key={`${url}-${index}`}>
              <img src={url} alt="" />
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (mobilePrintMode) {
    return (
      <Screen>
        <style>{`
          @page {
            size: A5 portrait;
            margin: 0;
          }

          html,
          body {
            background: ${currentTheme.printBackground} !important;
          }

          .mobile-direct-booth-sheet {
            width: 148mm;
            height: 210mm;
            margin: 0 auto;
            padding: 8mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4mm;
            overflow: hidden;
            background: ${currentTheme.printBackground};
            color: ${currentTheme.textColor};
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .mobile-direct-booth-sheet .booth-print-title {
            font-size: 10pt;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
          }

          .mobile-direct-booth-sheet .booth-print-photo {
            overflow: hidden;
            flex: 0 0 auto;
            background: ${currentTheme.frameBackground};
            border: 1.2mm solid ${currentTheme.border};
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .mobile-direct-booth-sheet .booth-print-photo img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center center;
          }

          .mobile-direct-booth-sheet .booth-print-strip {
            display: flex;
            flex-direction: column;
            gap: 2.5mm;
          }

          .mobile-direct-booth-sheet .booth-print-strip .booth-print-photo {
            width: 106mm;
            height: 43mm;
          }

          .mobile-direct-booth-sheet .booth-print-grid {
            display: grid;
            grid-template-columns: repeat(2, 58mm);
            gap: 3mm;
          }

          .mobile-direct-booth-sheet .booth-print-grid .booth-print-photo {
            width: 58mm;
            height: 72mm;
          }

          .mobile-direct-booth-sheet .booth-print-film {
            width: 92mm;
            padding: 3mm;
            display: flex;
            flex-direction: column;
            gap: 2mm;
            background: ${theme === "bold" ? "#020617" : "#111827"};
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .mobile-direct-booth-sheet .booth-print-film-frame {
            padding: 1.5mm 4mm;
            background:
              repeating-linear-gradient(90deg, white 0 2mm, transparent 2mm 7mm) top / 100% 2mm no-repeat,
              repeating-linear-gradient(90deg, white 0 2mm, transparent 2mm 7mm) bottom / 100% 2mm no-repeat;
          }

          .mobile-direct-booth-sheet .booth-print-film-frame .booth-print-photo {
            width: 76mm;
            height: 38mm;
            border-color: white;
          }

          @media print {
            html,
            body {
              width: 148mm;
              height: 210mm;
              margin: 0 !important;
              padding: 0 !important;
              background: ${currentTheme.printBackground} !important;
            }

            .mobile-direct-booth-sheet {
              position: fixed !important;
              inset: 0 auto auto 0 !important;
              margin: 0 !important;
            }
          }
        `}</style>
        <div className="flex min-h-[100dvh] items-start justify-center" style={{ background: currentTheme.printBackground }}>
          <div className="mobile-direct-booth-sheet">{printSheetContent}</div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <style>{`
        .booth-print-sheet {
          position: fixed;
          left: -10000px;
          top: 0;
          width: 148mm;
          height: 210mm;
          opacity: 0;
          pointer-events: none;
        }

        @page {
          size: A5 portrait;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: 148mm;
            height: 210mm;
            margin: 0 !important;
            padding: 0 !important;
            background: ${currentTheme.printBackground} !important;
          }

          body * {
            visibility: hidden !important;
          }

          .booth-print-output,
          .booth-print-output * {
            visibility: visible !important;
          }

          .booth-print-output {
            display: flex !important;
            position: fixed !important;
            inset: 0 auto auto 0 !important;
            width: 148mm !important;
            height: 210mm !important;
            overflow: hidden !important;
            background: ${currentTheme.printBackground} !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .booth-print-output img {
            display: block !important;
            width: 148mm !important;
            height: 210mm !important;
            object-fit: contain !important;
          }

          .booth-print-sheet {
            display: none !important;
          }

          .booth-print-title {
            font-size: 10pt !important;
            font-weight: 700 !important;
            letter-spacing: 0.18em !important;
            text-transform: uppercase !important;
          }

          .booth-print-photo {
            overflow: hidden !important;
            flex: 0 0 auto !important;
            background: ${currentTheme.frameBackground} !important;
            border: 1.2mm solid ${currentTheme.border} !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .booth-print-photo img {
            display: block !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: center center !important;
          }

          .booth-print-strip {
            display: flex !important;
            flex-direction: column !important;
            gap: 2.5mm !important;
          }

          .booth-print-strip .booth-print-photo {
            width: 106mm !important;
            height: 43mm !important;
          }

          .booth-print-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 58mm) !important;
            gap: 3mm !important;
          }

          .booth-print-grid .booth-print-photo {
            width: 58mm !important;
            height: 72mm !important;
          }

          .booth-print-film {
            width: 92mm !important;
            padding: 3mm !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 2mm !important;
            background: ${theme === "bold" ? "#020617" : "#111827"} !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .booth-print-film-frame {
            padding: 1.5mm 4mm !important;
            background:
              repeating-linear-gradient(90deg, white 0 2mm, transparent 2mm 7mm) top / 100% 2mm no-repeat,
              repeating-linear-gradient(90deg, white 0 2mm, transparent 2mm 7mm) bottom / 100% 2mm no-repeat !important;
          }

          .booth-print-film-frame .booth-print-photo {
            width: 76mm !important;
            height: 38mm !important;
            border-color: white !important;
          }
        }
      `}</style>
      <NavHeader onBack={onBack} title="Photo Booth Print" step={4} totalSteps={5} />

      <div className="booth-print-sheet" aria-hidden="true">
        {printSheetContent}
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-6 gap-4 overflow-hidden">
        <div className="flex items-center gap-4 bg-white rounded-xl border border-[#E2E8F0] px-4 py-2.5 shadow-sm text-sm">
          <span className="text-[#64748B]">A5 Photo Paper</span>
          <span className="w-px h-4 bg-[#E2E8F0]" />
          <span className="font-semibold text-[#2563EB] capitalize">{currentTheme.label} / {layout}</span>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center">
          <div className={`booth-print-output h-[525px] w-[370px] border border-[#CBD5E1] shadow-2xl ${currentTheme.sheetClass}`}>
            {printImageUrl ? (
              <img src={printImageUrl} alt="Final photo booth print sheet" className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#64748B]">
                Preparing print image...
              </div>
            )}
          </div>
        </div>
        {printImageError && (
          <p className="text-center text-sm font-semibold text-red-600">{printImageError}</p>
        )}

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
