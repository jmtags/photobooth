{/* MARKER-MAKE-KIT-INVOKED */}
import { useCallback, useEffect, useMemo, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { InstructionsScreen } from "./components/InstructionsScreen";
import { CameraScreen } from "./components/CameraScreen";
import { PhotoReviewScreen } from "./components/PhotoReviewScreen";
import { PhotoOptionsScreen, type PhotoOptions } from "./components/PhotoOptionsScreen";
import { LivePreviewScreen } from "./components/LivePreviewScreen";
import { PrintLayoutScreen } from "./components/PrintLayoutScreen";
import { PrintingScreen } from "./components/PrintingScreen";
import { SuccessScreen } from "./components/SuccessScreen";
import { AdminDashboard } from "./components/AdminDashboard";

type Screen =
  | "welcome"
  | "instructions"
  | "camera"
  | "review"
  | "options"
  | "preview"
  | "layout"
  | "printing"
  | "success"
  | "admin";

type LayoutMode = "auto" | "portrait" | "landscape";

type DisplaySettings = {
  layoutMode: LayoutMode;
  kioskMode: boolean;
};

const defaultOptions: PhotoOptions = {
  background: "white",
  attire: "original",
  smoothing: false,
  brightness: true,
  skinTone: false,
  printSize: "2x2",
};

const displaySettingsKey = "photobooth-display-settings";

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [processedPhotoUrl, setProcessedPhotoUrl] = useState<string>("");
  const [options, setOptions] = useState<PhotoOptions>(defaultOptions);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    layoutMode: "auto",
    kioskMode: false,
  });
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === "undefined" ? 1280 : window.innerWidth
  );
  const [fullscreenActive, setFullscreenActive] = useState(
    typeof document === "undefined" ? false : Boolean(document.fullscreenElement)
  );

  const go = (s: Screen) => setScreen(s);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(displaySettingsKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<DisplaySettings>;
      setDisplaySettings((current) => ({
        layoutMode:
          parsed.layoutMode === "portrait" ||
          parsed.layoutMode === "landscape" ||
          parsed.layoutMode === "auto"
            ? parsed.layoutMode
            : current.layoutMode,
        kioskMode:
          typeof parsed.kioskMode === "boolean" ? parsed.kioskMode : current.kioskMode,
      }));
    } catch {
      // Ignore invalid saved settings.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(displaySettingsKey, JSON.stringify(displaySettings));
  }, [displaySettings]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => setViewportWidth(window.innerWidth);
    const handleFullscreenChange = () => {
      setFullscreenActive(Boolean(document.fullscreenElement));
    };

    handleResize();
    handleFullscreenChange();
    window.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const effectiveLayout = useMemo<"portrait" | "landscape">(() => {
    if (displaySettings.layoutMode === "portrait") return "portrait";
    if (displaySettings.layoutMode === "landscape") return "landscape";
    return viewportWidth < 768 ? "portrait" : "landscape";
  }, [displaySettings.layoutMode, viewportWidth]);

  const requestFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return;

    try {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    } catch {
      // Some browsers only partially support fullscreen controls.
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (typeof document === "undefined" || !document.fullscreenElement) return;

    try {
      await document.exitFullscreen();
    } catch {
      // Ignore failed exits.
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await exitFullscreen();
      return;
    }

    await requestFullscreen();
  }, [exitFullscreen, requestFullscreen]);

  const toggleKioskMode = useCallback(() => {
    setDisplaySettings((current) => {
      const nextKioskMode = !current.kioskMode;

      if (nextKioskMode) {
        void requestFullscreen();
      } else {
        void exitFullscreen();
      }

      return { ...current, kioskMode: nextKioskMode };
    });
  }, [exitFullscreen, requestFullscreen]);

  const handleCapture = useCallback((url: string) => {
    setPhotoUrl(url);
    setProcessedPhotoUrl("");
    setProcessError(null);
    go("review");
  }, []);

  const handlePreview = async () => {
    setProcessing(true);
    setProcessError(null);

    try {
      const response = await fetch("/api/process-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl, options }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { error: await response.text() };

      if (!response.ok) {
        const detailText = data.details?.openaiRequestId
          ? ` Request ID: ${data.details.openaiRequestId}.`
          : "";
        throw new Error(`${data.error ?? "Photo processing failed."}${detailText}`);
      }

      if (!data.processedPhotoUrl) {
        throw new Error("Photo processing did not return an image.");
      }

      setProcessedPhotoUrl(data.processedPhotoUrl);
      go("preview");
    } catch (err) {
      setProcessError(err instanceof Error ? err.message : "Photo processing failed.");
    } finally {
      setProcessing(false);
    }
  };

  const handleNewSession = () => {
    setPhotoUrl("");
    setProcessedPhotoUrl("");
    setOptions(defaultOptions);
    setProcessError(null);
    go("welcome");
  };

  return (
    <div className="w-full min-h-[100dvh] bg-[#0F172A] font-[Inter,sans-serif]">
      <div
        data-layout={effectiveLayout}
        className={`mx-auto h-[100dvh] overflow-hidden bg-[#F8FAFC] ${
          effectiveLayout === "portrait"
            ? "w-full max-w-[32rem] shadow-[0_0_0_1px_rgba(148,163,184,0.2),0_24px_80px_rgba(15,23,42,0.35)]"
            : "w-full"
        }`}
      >
        {screen === "welcome" && (
          <WelcomeScreen onStart={() => go("camera")} onAdmin={() => go("admin")} />
        )}
        {screen === "instructions" && (
          <InstructionsScreen onBack={() => go("welcome")} onContinue={() => go("camera")} />
        )}
        {screen === "camera" && (
          <CameraScreen onBack={() => go("welcome")} onCapture={handleCapture} />
        )}
        {screen === "review" && photoUrl && (
          <PhotoReviewScreen
            photoUrl={photoUrl}
            onRetake={() => go("camera")}
            onAccept={() => go("options")}
          />
        )}
        {screen === "options" && (
          <PhotoOptionsScreen
            options={options}
            onChange={setOptions}
            onBack={() => go("review")}
            onContinue={handlePreview}
            processing={processing}
            processError={processError}
          />
        )}
        {screen === "preview" && (
          <LivePreviewScreen
            photoUrl={processedPhotoUrl || photoUrl}
            options={options}
            onBack={() => go("options")}
            onGenerate={() => go("layout")}
          />
        )}
        {screen === "layout" && (
          <PrintLayoutScreen
            photoUrl={processedPhotoUrl || photoUrl}
            options={options}
            onBack={() => go("preview")}
            onPrint={() => go("printing")}
          />
        )}
        {screen === "printing" && <PrintingScreen onDone={() => go("success")} />}
        {screen === "success" && (
          <SuccessScreen
            onPrintAnother={() => go("printing")}
            onNewSession={handleNewSession}
          />
        )}
        {screen === "admin" && (
          <AdminDashboard
            onExit={() => go("welcome")}
            layoutMode={displaySettings.layoutMode}
            onLayoutModeChange={(layoutMode) =>
              setDisplaySettings((current) => ({ ...current, layoutMode }))
            }
            kioskMode={displaySettings.kioskMode}
            fullscreenActive={fullscreenActive}
            onToggleKioskMode={toggleKioskMode}
            onToggleFullscreen={toggleFullscreen}
          />
        )}
      </div>

      {fullscreenActive && (
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="fixed right-3 top-3 z-50 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm"
        >
          <Minimize size={14} />
          Show Browser
        </button>
      )}

      {!fullscreenActive && displaySettings.kioskMode && screen !== "admin" && (
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="fixed right-3 top-3 z-50 inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-900/20"
        >
          <Maximize size={14} />
          Fullscreen
        </button>
      )}
    </div>
  );
}
