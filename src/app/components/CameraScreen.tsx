import { useEffect, useRef, useState } from "react";
import { NavHeader, Btn } from "./ui";
import { Camera, Maximize, RotateCcw, SwitchCamera } from "lucide-react";

interface Props {
  onBack: () => void;
  onCapture: (dataUrl: string) => void;
  appMode?: "id-photo" | "photo-booth";
  boothCaptureCount?: number;
  boothCaptureTotal?: number;
  boothPhotoUrls?: string[];
  kioskMode: boolean;
  fullscreenActive: boolean;
  onRequestFullscreen: () => void | Promise<void>;
}

export function CameraScreen({
  onBack,
  onCapture,
  appMode = "id-photo",
  boothCaptureCount = 0,
  boothCaptureTotal = 3,
  boothPhotoUrls = [],
  kioskMode,
  fullscreenActive,
  onRequestFullscreen,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const isPhotoBooth = appMode === "photo-booth";
  const nextBoothShot = Math.min(boothCaptureCount + 1, boothCaptureTotal);
  const autoCaptureKeyRef = useRef("");

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

  useEffect(() => {
    if (!isPhotoBooth || !ready || error || countdown !== null) return;
    if (boothCaptureCount >= boothCaptureTotal) return;

    const key = `${boothCaptureCount}-${boothCaptureTotal}`;
    if (autoCaptureKeyRef.current === key) return;
    autoCaptureKeyRef.current = key;

    const timeout = window.setTimeout(() => {
      handleCapture();
    }, boothCaptureCount === 0 ? 1000 : 1400);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boothCaptureCount, boothCaptureTotal, countdown, error, isPhotoBooth, ready]);

  return (
    <div className="h-full min-h-full bg-black flex flex-col font-[Inter,sans-serif]">
      <div className="relative z-10">
        <NavHeader
          onBack={onBack}
          title={isPhotoBooth ? `Photo ${nextBoothShot} of ${boothCaptureTotal}` : "Take Photo"}
          step={0}
          totalSteps={5}
        />
      </div>

      <div className="flex-1 overflow-y-auto bg-black">
        <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 px-4 py-4 md:px-6 md:py-6 lg:flex-row lg:items-stretch lg:gap-6">
          <div className="relative flex min-h-[22rem] flex-1 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-[#020617] shadow-2xl lg:min-h-[32rem]">
            {error ? (
              <div className="flex flex-col items-center gap-4 px-8 text-center text-white">
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
                  className="h-full w-full object-cover"
                  style={{ transform: facing === "user" ? "scaleX(-1)" : "none" }}
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-72 w-56 md:h-96 md:w-72">
                    <div className="absolute inset-0 rounded-full border-4 border-white/60" />
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 224 288">
                      <path d="M0 40 L0 0 L40 0" stroke="#2563EB" strokeWidth="4" fill="none" strokeLinecap="round" />
                      <path d="M184 0 L224 0 L224 40" stroke="#2563EB" strokeWidth="4" fill="none" strokeLinecap="round" />
                      <path d="M0 248 L0 288 L40 288" stroke="#2563EB" strokeWidth="4" fill="none" strokeLinecap="round" />
                      <path d="M184 288 L224 288 L224 248" stroke="#2563EB" strokeWidth="4" fill="none" strokeLinecap="round" />
                    </svg>
                    <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
                      <div className="absolute left-0 right-0 top-1/2 h-px bg-white/40" />
                      <div className="absolute bottom-0 left-1/2 top-0 w-px bg-white/40" />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-5 left-4 right-4 flex justify-center">
                  <span className="rounded-full bg-black/55 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                    {ready
                      ? isPhotoBooth
                        ? `Auto capture ${nextBoothShot} of ${boothCaptureTotal}`
                        : "Center your face in the guide"
                      : "Starting camera..."}
                  </span>
                </div>

                {countdown !== null && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 rounded-[28px] bg-black/70 px-8 py-6 text-center shadow-2xl">
                      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                        {isPhotoBooth ? `Photo ${nextBoothShot}` : "Get Ready"}
                      </span>
                      <span className="text-7xl font-extrabold text-white">{countdown}</span>
                      <span className="text-base font-semibold text-white">
                        {countdown === 1 ? "Smile!" : "Hold still"}
                      </span>
                    </div>
                  </div>
                )}

                {kioskMode && !fullscreenActive && (
                  <div className="absolute right-4 top-4 z-20">
                    <Btn
                      onClick={() => void onRequestFullscreen()}
                      size="sm"
                      className="rounded-full shadow-lg shadow-blue-900/20"
                    >
                      <Maximize size={16} />
                      Resume Fullscreen
                    </Btn>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex w-full flex-col gap-4 rounded-[28px] bg-black/90 p-4 text-white lg:w-[20rem] lg:flex-shrink-0 lg:justify-between">
            <div className="flex flex-col gap-3">
              <p className="text-lg font-semibold">
                {isPhotoBooth ? "Photo Booth" : "Camera Controls"}
              </p>
              <p className="text-sm text-white/65">
                {isPhotoBooth
                  ? "The camera will automatically take four photos, then prepare your print sheet."
                  : "Landscape mode now keeps the preview contained so the action buttons stay visible on tablets and PCs."}
              </p>
            </div>

            {isPhotoBooth && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Captured</p>
                  <p className="text-xs font-semibold text-white/60">
                    {boothCaptureCount}/{boothCaptureTotal}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
                  {Array.from({ length: boothCaptureTotal }, (_, index) => {
                    const url = boothPhotoUrls[index];
                    const active = index === boothCaptureCount && countdown !== null;
                    return (
                      <div
                        key={index}
                        className={`relative aspect-[4/3] overflow-hidden rounded-xl border ${
                          url
                            ? "border-white/30 bg-white"
                            : active
                            ? "border-[#2563EB] bg-blue-500/20"
                            : "border-white/10 bg-black/30"
                        }`}
                      >
                        {url ? (
                          <img src={url} alt={`Captured photo ${index + 1}`} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/50">
                            {index + 1}
                          </div>
                        )}
                        {active && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-bold text-white">
                            {countdown}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-stretch">
              <button
                type="button"
                onClick={handleSwitch}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 lg:h-16 lg:w-full lg:rounded-2xl"
                aria-label="Switch camera"
              >
                <span className="flex items-center gap-2 lg:text-sm lg:font-semibold">
                  <SwitchCamera size={22} />
                  <span className="hidden lg:inline">Switch</span>
                </span>
              </button>

              <button
                type="button"
                onClick={handleCapture}
                disabled={!ready || countdown !== null}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg transition-all active:scale-95 disabled:opacity-50 lg:h-28 lg:w-full lg:rounded-[28px]"
                aria-label="Capture photo"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#2563EB] lg:h-20 lg:w-20">
                  <Camera size={28} color="#2563EB" />
                </div>
              </button>

              <button
                type="button"
                onClick={doCapture}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 lg:h-16 lg:w-full lg:rounded-2xl"
                aria-label="Capture now"
              >
                <span className="flex items-center gap-2 lg:text-sm lg:font-semibold">
                  <RotateCcw size={22} />
                  <span className="hidden lg:inline">Instant</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
