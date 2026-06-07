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
  const [options, setOptions] = useState<PhotoOptions>(defaultOptions);

  const go = (s: Screen) => setScreen(s);

  const handleCapture = useCallback((url: string) => {
    setPhotoUrl(url);
    go("review");
  }, []);

  const handleNewSession = () => {
    setPhotoUrl("");
    setOptions(defaultOptions);
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
          onContinue={() => go("preview")}
        />
      )}
      {screen === "preview" && (
        <LivePreviewScreen
          photoUrl={photoUrl}
          options={options}
          onBack={() => go("options")}
          onGenerate={() => go("layout")}
        />
      )}
      {screen === "layout" && (
        <PrintLayoutScreen
          photoUrl={photoUrl}
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
