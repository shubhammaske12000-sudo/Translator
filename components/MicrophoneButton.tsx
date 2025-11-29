import React from 'react';

interface MicrophoneButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onClick: () => void;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ isRecording, isProcessing, onClick }) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Ripple effects when recording */}
      {isRecording && (
        <>
          <div className="absolute w-24 h-24 bg-red-500 rounded-full opacity-20 animate-ping"></div>
          <div className="absolute w-20 h-20 bg-red-500 rounded-full opacity-30 animate-pulse"></div>
        </>
      )}

      {/* Main Button */}
      <button
        onClick={onClick}
        disabled={isProcessing}
        className={`
          relative z-10 flex items-center justify-center w-20 h-20 rounded-full 
          transition-all duration-300 shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-900
          ${isRecording 
            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500 scale-110' 
            : 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500 hover:scale-105'
          }
          ${isProcessing ? 'bg-slate-600 cursor-not-allowed opacity-75' : ''}
        `}
        aria-label={isRecording ? "Stop Recording" : "Start Recording"}
      >
        {isProcessing ? (
          <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`w-8 h-8 text-white ${isRecording ? 'animate-pulse' : ''}`}
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        )}
      </button>
      
      {/* Label */}
      <div className="absolute -bottom-12 text-sm font-medium text-slate-300 w-40 text-center">
        {isProcessing 
          ? "Translating..." 
          : isRecording 
            ? "Listening..." 
            : "Tap to Speak"}
      </div>
    </div>
  );
};

export default MicrophoneButton;
