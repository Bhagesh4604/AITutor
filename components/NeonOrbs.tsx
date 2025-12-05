
import React, { useEffect, useState } from 'react';

export const NeonOrbs: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Top-left orb */}
      <div
        className={`absolute transition-all duration-1000 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
        }`}
        style={{
          top: "-20%",
          left: "-20%",
          width: "120%",
          height: "120%",
        }}
      >
        <div className="w-full h-full rounded-full relative orb-light transition-all duration-500">
          <div className="beam-container beam-spin-8">
            <div className="beam-light" />
          </div>
        </div>
      </div>

      {/* Bottom-center orb */}
      <div
        className={`absolute transition-all duration-1000 ease-out delay-300 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
        style={{
          bottom: "-30%",
          left: "20%",
          width: "150%",
          height: "150%",
        }}
      >
        <div className="w-full h-full rounded-full relative orb-light transition-all duration-500">
          <div className="beam-container beam-spin-10-reverse">
            <div className="beam-light" />
          </div>
        </div>
      </div>

      {/* Top-right orb */}
      <div
        className={`absolute transition-all duration-1000 ease-out delay-500 ${
          mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
        }`}
        style={{
          top: "-10%",
          right: "-40%",
          width: "100%",
          height: "100%",
        }}
      >
        <div className="w-full h-full rounded-full relative orb-light transition-all duration-500">
          <div className="beam-container beam-spin-6">
            <div className="beam-light" />
          </div>
        </div>
      </div>

      <style>{`
        .beam-container {
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          will-change: transform;
        }
        
        .beam-light {
          position: absolute;
          top: 0;
          left: 50%;
          width: 60px;
          height: 4px;
          margin-left: -30px;
          border-radius: 2px;
          transform: translateY(-50%);
          transition: all 0.5s;
          background: linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.5) 30%, rgba(129, 140, 248, 0.9) 70%, rgba(99, 102, 241, 1) 100%);
          box-shadow: 0 0 20px 4px rgba(99, 102, 241, 0.6), 0 0 40px 8px rgba(129, 140, 248, 0.3);
        }
        
        /* Dark mode adjustments for beams */
        :global(.dark) .beam-light {
           background: linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.5) 30%, rgba(167, 139, 250, 0.9) 70%, rgba(139, 92, 246, 1) 100%);
           box-shadow: 0 0 20px 4px rgba(139, 92, 246, 0.6), 0 0 40px 8px rgba(167, 139, 250, 0.3);
        }
        
        .orb-light {
          background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 90%, transparent 100%);
          box-shadow: 
            0 0 60px 2px rgba(99, 102, 241, 0.1),
            0 0 100px 5px rgba(99, 102, 241, 0.05),
            inset 0 0 60px 2px rgba(99, 102, 241, 0.02);
          border: 1px solid rgba(99, 102, 241, 0.1);
        }

        :global(.dark) .orb-light {
           background: radial-gradient(circle at 50% 50%, rgba(17, 24, 39, 0) 0%, rgba(17, 24, 39, 0.4) 90%, transparent 100%);
           box-shadow: 
            0 0 60px 2px rgba(139, 92, 246, 0.2),
            0 0 100px 5px rgba(139, 92, 246, 0.1),
            inset 0 0 60px 2px rgba(139, 92, 246, 0.05);
           border: 1px solid rgba(139, 92, 246, 0.2);
        }
        
        .beam-spin-6 {
          animation: spin 6s linear infinite;
        }
        
        .beam-spin-7-reverse {
          animation: spin-reverse 7s linear infinite;
        }
        
        .beam-spin-8 {
          animation: spin 8s linear infinite;
        }
        
        .beam-spin-10-reverse {
          animation: spin-reverse 10s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
};
