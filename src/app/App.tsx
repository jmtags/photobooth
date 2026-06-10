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
import { processPhotoLocally } from "./local-photo-processing";

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
  edgeCleanup: "clean",
  printSize: "2x2",
};

const displaySettingsKey = "photobooth-display-settings";

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [processedPhotoUrl, setProcessedPhotoUrl] = useState<string>("");
  const [options, setOptions] = useState<PhotoOptions>(defaultOptions);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [processNotice, setProcessNotice] = useState<string | null>(null);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    layoutMode: "auto",
    kioskMode: false,
  });
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === "undefined" ? 1280 : window.innerWidth
  );
  const [fullscreenActive, setFullscreenActive] = useState(
    typeof document === "undefined"
      ? false
      : Boolean(
          (document as FullscreenDocument).fullscreenElement ??
            (document as FullscreenDocument).webkitFullscreenElement
        )
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
      const doc = document as FullscreenDocument;
      setFullscreenActive(Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement));
    };

    handleResize();
    handleFullscreenChange();
    window.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange as EventListener);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange as EventListener);
    };
  }, []);

  const effectiveLayout = useMemo<"portrait" | "landscape">(() => {
    if (displaySettings.layoutMode === "portrait") return "portrait";
    if (displaySettings.layoutMode === "landscape") return "landscape";
    return viewportWidth < 768 ? "portrait" : "landscape";
  }, [displaySettings.layoutMode, viewportWidth]);

  const requestFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return;

    const root = document.documentElement as FullscreenElement;

    try {
      if (root.requestFullscreen) {
        try {
          await root.requestFullscreen({ navigationUI: "hide" });
        } catch {
          await root.requestFullscreen();
        }
        return;
      }
      if (root.webkitRequestFullscreen) {
        await root.webkitRequestFullscreen();
      }
    } catch {
      // Some browsers only partially support fullscreen controls.
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return;

    const doc = document as FullscreenDocument;
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) return;

    try {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
        return;
      }
      if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      }
    } catch {
      // Ignore failed exits.
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const doc = document as FullscreenDocument;
    if (doc.fullscreenElement ?? doc.webkitFullscreenElement) {
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
    setProcessNotice(null);
    go("review");
  }, []);

  const handlePreview = async () => {
    setProcessing(true);
    setProcessError(null);
    setProcessNotice(null);

    try {
      const result = await processPhotoLocally({ photoUrl, options });

      if (!result.processedPhotoUrl) {
        throw new Error("Photo processing did not return an image.");
      }

      setProcessedPhotoUrl(result.processedPhotoUrl);
      setProcessNotice(typeof result.notice === "string" ? result.notice : null);
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
    setProcessNotice(null);
    go("welcome");
  };

  return (
    <div className="w-full min-h-[100dvh] bg-[#0F172A] font-[Inter,sans-serif]">
      <div
        data-layout={effectiveLayout}
        className={`mx-auto h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#F8FAFC] ${
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
          <CameraScreen
            onBack={() => go("welcome")}
            onCapture={handleCapture}
            kioskMode={displaySettings.kioskMode}
            fullscreenActive={fullscreenActive}
            onRequestFullscreen={toggleFullscreen}
          />
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
            originalPhotoUrl={photoUrl}
            options={options}
            processNotice={processNotice}
            onBack={() => go("options")}
            onGenerate={() => go("layout")}
          />
        )}
        {screen === "layout" && (
          <PrintLayoutScreen
            photoUrl={processedPhotoUrl || photoUrl}
            originalPhotoUrl={photoUrl}
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
          className={`fixed z-50 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm ${
            screen === "welcome" ? "bottom-4 right-4" : "right-3 top-3"
          }`}
        >
          <Minimize size={14} />
          Show Browser
        </button>
      )}

      {!fullscreenActive && displaySettings.kioskMode && screen !== "admin" && (
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className={`fixed z-50 inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-900/20 ${
            screen === "welcome" ? "bottom-4 right-4" : "right-3 top-3"
          }`}
        >
          <Maximize size={14} />
          Fullscreen
        </button>
      )}
    </div>
  );
}
