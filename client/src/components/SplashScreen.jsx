import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onFinish }) => {
    const [phase, setPhase] = useState('enter'); // enter → hold → exit

    useEffect(() => {
        // Phase 1: Entrance animation plays (CSS handles it)
        const holdTimer = setTimeout(() => setPhase('hold'), 600);
        // Phase 2: Start exit after content has likely loaded
        const exitTimer = setTimeout(() => setPhase('exit'), 3200);
        // Phase 3: Remove splash screen
        const finishTimer = setTimeout(() => onFinish(), 3800);

        return () => {
            clearTimeout(holdTimer);
            clearTimeout(exitTimer);
            clearTimeout(finishTimer);
        };
    }, [onFinish]);

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0c10] transition-opacity duration-500 ${phase === 'exit' ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
        >
            {/* Ambient glows */}
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
                    style={{
                        background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)',
                        animation: 'splashPulse 2s ease-in-out infinite',
                    }}
                />
                <div
                    className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full opacity-10"
                    style={{
                        background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)',
                        animation: 'splashPulse 2.5s ease-in-out infinite 0.5s',
                    }}
                />
            </div>

            {/* Main content */}
            <div
                className={`relative flex flex-col items-center transition-all duration-700 ${phase === 'enter'
                    ? 'scale-90 opacity-0'
                    : 'scale-100 opacity-100'
                    }`}
            >
                {/* Logo */}
                <div className="relative mb-6">
                    <div
                        className="w-24 h-24 bg-gradient-to-tr from-emerald-400 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30"
                        style={{ animation: 'splashFloat 3s ease-in-out infinite' }}
                    >
                        <span className="text-white font-black text-5xl tracking-tight">K</span>
                    </div>
                    {/* Glow ring */}
                    <div
                        className="absolute -inset-3 rounded-[2rem] border border-emerald-500/20"
                        style={{ animation: 'splashRing 2s ease-in-out infinite' }}
                    />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-black text-white tracking-tight mb-1">
                    K-<span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Forum</span>
                </h1>
                <p className="text-gray-500 text-sm font-medium tracking-widest uppercase">
                    Student Community
                </p>

                {/* Loading bar */}
                <div className="mt-8 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                        style={{
                            animation: 'splashLoad 3s ease-in-out forwards',
                        }}
                    />
                </div>
            </div>

            {/* Keyframe animations */}
            <style>{`
        @keyframes splashPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.2; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.3; }
        }
        @keyframes splashFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes splashRing {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        @keyframes splashLoad {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
        </div>
    );
};

export default SplashScreen;
