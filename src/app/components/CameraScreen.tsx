import { useEffect, useRef, useState } from "react";
import { NavHeader, Btn } from "./ui";
import { Camera, RotateCcw, SwitchCamera } from "lucide-react";

interface Props {
  onBack: () => void;
  onCapture: (dataUrl: string) => void;
}

export function CameraScreen({ onBack, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  };

  const getCameraErrorMessage = (err: unknown) => {
    if (!window.isSecureContext) {
      return "Camera requires HTTPS on Android. Open the secure HTTPS URL, then allow camera permission.";
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      return "This browser does not support camera access. Try Chrome on Android.";
    }

    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "SecurityError") {
      return "Camera permission was blocked. Allow camera access in the browser and try again.";
    }
    if (name === "NotFoundError" || name === "OverconstrainedError") {
      return "No compatible camera was found. Try switching cameras or checking device permissions.";
    }
    if (name === "NotReadableError") {
      return "The camera is already in use by another app. Close other camera apps and try again.";
    }

    return "Camera could not start. Please allow camera permissions and try again.";
  };

  const startCamera = async (facingMode: "user" | "environment") => {
    stopCamera();
    setReady(false);
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not support camera access. Try Chrome on Android.");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 960 } },
      };
      const s = await navigator.mediaDevices.getUserMedia(constraints).catch(() =>
        navigator.mediaDevices.getUserMedia({ audio: false, video: true })
      );
      streamRef.current = s;
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => undefined);
        };
        videoRef.current.oncanplay = () => setReady(true);
        await videoRef.current.play().catch(() => undefined);
      }
    } catch (err) {
      setError(getCameraErrorMessage(err));
    }
  };

  useEffect(() => {
    startCamera(facing);
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwitch = () => {
    const next = facing === "user" ? "environment" : "user";
    setFacing(next);
    startCamera(next);
  };

  const handleCapture = () => {
    if (countdown !== null) return;
    setCountdown(3);
    let c = 3;
    const interval = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c === 0) {
        clearInterval(interval);
        setCountdown(null);
        doCapture();
      }
    }, 1000);
  };

  const doCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facing === "user") {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0);
    }
    onCapture(canvas.toDataURL("image/jpeg", 0.92));
  };

  return (
    <div className="min-h-screen bg-black flex flex-col font-[Inter,sans-serif]">
      <div className="absolute top-0 left-0 right-0 z-10">
        <NavHeader onBack={onBack} title="Take Photo" step={2} totalSteps={7} />
      </div>

      {/* Camera preview */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center gap-4 text-white px-8 text-center">
            <Camera size={48} className="opacity-50" />
            <p className="text-sm opacity-70">{error}</p>
            <Btn onClick={() => startCamera(facing)} variant="secondary" size="sm">
              Try Again
            </Btn>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facing === "user" ? "scaleX(-1)" : "none" }}
            />
            {/* Overlay guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-72 md:w-72 md:h-96">
                {/* Oval guide */}
                <div className="absolute inset-0 border-4 border-white/60 rounded-full" />
                {/* Corner brackets */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 224 288">
                  <path d="M0 40 L0 0 L40 0" stroke="#2563EB" strokeWidth="4" fill="none" strokeLinecap="round" />
                  <path d="M184 0 L224 0 L224 40" stroke="#2563EB" strokeWidth="4" fill="none" strokeLinecap="round" />
                  <path d="M0 248 L0 288 L40 288" stroke="#2563EB" strokeWidth="4" fill="none" strokeLinecap="round" />
                  <path d="M184 288 L224 288 L224 248" stroke="#2563EB" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
                {/* Center crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/40" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/40" />
                </div>
              </div>
              <div className="absolute bottom-28 left-0 right-0 flex justify-center">
                <span className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {ready ? "Center your face in the guide" : "Starting camera..."}
                </span>
              </div>
            </div>

            {/* Countdown */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-24 h-24 rounded-full bg-black/60 flex items-center justify-center">
                  <span className="text-white text-5xl font-bold">{countdown}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black/90 px-6 pt-4 pb-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleSwitch}
          className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          aria-label="Switch camera"
        >
          <SwitchCamera size={22} />
        </button>

        <button
          type="button"
          onClick={handleCapture}
          disabled={!ready || countdown !== null}
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50"
          aria-label="Capture photo"
        >
          <div className="w-16 h-16 rounded-full border-4 border-[#2563EB] flex items-center justify-center">
            <Camera size={28} color="#2563EB" />
          </div>
        </button>

        <button
          type="button"
          onClick={doCapture}
          className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          aria-label="Capture now"
        >
          <RotateCcw size={22} />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
