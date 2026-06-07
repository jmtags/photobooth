{/* MARKER-MAKE-KIT-INVOKED */}
import { useState, useCallback } from "react";
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

const defaultOptions: PhotoOptions = {
  background: "white",
  attire: "original",
  smoothing: false,
  brightness: true,
  skinTone: false,
  printSize: "2x2",
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [processedPhotoUrl, setProcessedPhotoUrl] = useState<string>("");
  const [options, setOptions] = useState<PhotoOptions>(defaultOptions);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  const go = (s: Screen) => setScreen(s);

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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Photo processing failed.");
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
    <div className="w-full min-h-screen font-[Inter,sans-serif]">
      {screen === "welcome" && (
        <WelcomeScreen onStart={() => go("instructions")} onAdmin={() => go("admin")} />
      )}
      {screen === "instructions" && (
        <InstructionsScreen onBack={() => go("welcome")} onContinue={() => go("camera")} />
      )}
      {screen === "camera" && (
        <CameraScreen onBack={() => go("instructions")} onCapture={handleCapture} />
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
      {screen === "printing" && (
        <PrintingScreen onDone={() => go("success")} />
      )}
      {screen === "success" && (
        <SuccessScreen
          onPrintAnother={() => go("printing")}
          onNewSession={handleNewSession}
        />
      )}
      {screen === "admin" && (
        <AdminDashboard onExit={() => go("welcome")} />
      )}
    </div>
  );
}
