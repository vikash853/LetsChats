import { useState, useRef, useEffect } from "react";
import { useChat } from "../../context/ChatContext";

const VoiceRecorder = ({ onClose }) => {
  const { sendMessage } = useChat();
  const [phase,    setPhase]    = useState("recording"); // recording | preview | sending | error
  const [seconds,  setSeconds]  = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [errMsg,   setErrMsg]   = useState("");

  const mrRef      = useRef(null);
  const chunksRef  = useRef([]);
  const blobRef    = useRef(null);
  const timerRef   = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    startRecording();
    return () => {
      clearInterval(timerRef.current);
      mrRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      // Try formats in order of browser support
      const mimeType = ["audio/webm;codecs=opus","audio/webm","audio/ogg","audio/mp4",""]
        .find((m) => !m || MediaRecorder.isTypeSupported(m)) || "";

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mrRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setPhase("preview");
      };
      mr.onerror = (e) => { setErrMsg("Recording error: " + e.error?.message); setPhase("error"); };

      mr.start(250);
      setPhase("recording");
      timerRef.current = setInterval(() => setSeconds((s) => {
        if (s >= 120) { stopRecording(); return s; } // auto-stop at 2 mins
        return s + 1;
      }), 1000);
    } catch (err) {
      setErrMsg(err.name === "NotAllowedError"
        ? "Microphone permission denied. Please allow mic access in your browser settings."
        : "Could not access microphone: " + err.message);
      setPhase("error");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    mrRef.current?.stream?.getTracks().forEach((t) => t.stop());
    if (mrRef.current?.state === "recording") mrRef.current.stop();
  };

  const handleSend = async () => {
    if (!blobRef.current) return;
    setPhase("sending");
    try {
      // Convert to base64 — works without needing a separate upload endpoint
      await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            await sendMessage(
              `🎤 Voice message (${formatTime(seconds)})`,
              "voice",
              e.target.result,  // base64 data URL
              "voice.webm"
            );
            resolve();
          } catch (err) { reject(err); }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blobRef.current);
      });
      onClose();
    } catch (err) {
      setErrMsg("Failed to send: " + err.message);
      setPhase("error");
    }
  };

  const handleRedo = () => {
    startedRef.current = false;
    setAudioUrl(null);
    setSeconds(0);
    setErrMsg("");
    chunksRef.current = [];
    blobRef.current = null;
    startRecording();
  };

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2,"0")}:${(s % 60).toString().padStart(2,"0")}`;
  const formatTime = fmt;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎤</span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Voice message</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {phase === "recording" ? "Recording in progress…"
                : phase === "preview"  ? "Review before sending"
                : phase === "sending"  ? "Sending…"
                : "Error"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-5">

          {phase === "error" ? (
            <div className="text-center w-full">
              <p className="text-3xl mb-3">🚫</p>
              <p className="text-sm text-red-500 mb-4">{errMsg}</p>
              <button onClick={onClose} className="px-6 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200">Close</button>
            </div>
          ) : (
            <>
              {/* Timer display */}
              <div className="text-center">
                <p className={`text-5xl font-mono font-bold tabular-nums ${phase === "recording" ? "text-red-500" : "text-slate-700 dark:text-slate-200"}`}>
                  {fmt(seconds)}
                </p>
                {phase === "recording" && (
                  <div className="flex items-end justify-center gap-0.5 mt-4 h-10">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i}
                        className="w-1.5 bg-red-400 rounded-full"
                        style={{
                          height: `${Math.random() * 28 + 4}px`,
                          animation: `pulseDot ${0.4 + Math.random() * 0.6}s ease-in-out infinite alternate`,
                          animationDelay: `${i * 0.05}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Audio preview */}
              {phase === "preview" && audioUrl && (
                <audio controls src={audioUrl} className="w-full" autoPlay={false} />
              )}

              {/* Sending spinner */}
              {phase === "sending" && (
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Sending your voice message…</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 w-full">
                {phase === "recording" && (
                  <button onClick={stopRecording}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                    <span className="w-3 h-3 bg-white rounded-sm inline-block" />
                    Stop recording
                  </button>
                )}
                {phase === "preview" && (
                  <>
                    <button onClick={handleRedo}
                      className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-all">
                      🔄 Redo
                    </button>
                    <button onClick={handleSend}
                      className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all">
                      📤 Send
                    </button>
                  </>
                )}
              </div>

              {phase === "recording" && seconds > 0 && (
                <p className="text-xs text-slate-400 text-center">
                  Max 2 minutes · Tap stop when done
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;