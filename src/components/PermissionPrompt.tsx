import React from 'react';
import { Camera, RefreshCw, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';

interface PermissionPromptProps {
  error: string | null;
  onRetry: () => void;
  onUseSimulator: () => void;
}

export const PermissionPrompt: React.FC<PermissionPromptProps> = ({
  error,
  onRetry,
  onUseSimulator,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto no-scrollbar">
      <div className="w-full max-w-sm flex flex-col items-center my-auto">
        {/* Animated Icon Ring */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full bg-amber-400/10 border-2 border-amber-400/30 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(250,204,21,0.2)]">
            <Camera className="w-10 h-10" />
          </div>
          <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-neutral-900 border border-white/20 text-amber-400">
            <AlertCircle className="w-4 h-4" />
          </span>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white mb-2">
          Camera Access
        </h1>

        <p className="text-xs text-white/60 mb-5 leading-relaxed">
          {error ||
            'Camera permission is needed to stream from your physical camera. You can allow camera access in Chrome, or explore the interactive camera simulator.'}
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 mb-5">
          {/* Grant Real Camera Button */}
          <button
            onClick={onRetry}
            className="w-full py-3.5 rounded-2xl bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
          >
            <RefreshCw className="w-4 h-4 stroke-[2.5]" />
            <span>Grant Access / Try Camera</span>
          </button>

          {/* Launch Interactive Simulator Button */}
          <button
            onClick={onUseSimulator}
            className="w-full py-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/20 shadow-md active:scale-98 transition-transform"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Launch Camera Simulator (Demo Feed)</span>
          </button>
        </div>

        {/* Android Chrome Permissions Guide Box */}
        <div className="w-full bg-neutral-900 border border-white/10 rounded-2xl p-4 text-left space-y-2.5 text-xs text-white/70">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4" />
            <span>How to allow in Chrome on Android:</span>
          </div>

          <ol className="text-[11px] text-white/70 space-y-1.5 list-decimal list-inside leading-normal">
            <li>
              Tap the <strong>Page Info / Tune</strong> icon (
              <span className="inline-block px-1 bg-white/10 rounded font-mono text-[10px]">🔒</span> or{' '}
              <span className="inline-block px-1 bg-white/10 rounded font-mono text-[10px]">⚙️</span>) in the Chrome address bar.
            </li>
            <li>
              Select <strong>Permissions</strong> &rarr; <strong>Camera</strong>.
            </li>
            <li>
              Choose <strong>Allow</strong> (and Microphone for video audio).
            </li>
            <li>
              Return and tap <strong>Grant Access / Try Camera</strong> above.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
