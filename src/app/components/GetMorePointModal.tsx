import { useEffect } from 'react';
import { X, Zap } from 'lucide-react';

interface GetMorePointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWatchAd: () => void;
  triggerSource?: 'slot' | 'center';
}

export default function GetMorePointModal({ isOpen, onClose, onWatchAd, triggerSource = 'slot' }: GetMorePointModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl border border-gray-800 shadow-2xl shadow-cyan-500/20 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-b from-cyan-500/20 to-transparent blur-3xl"></div>

        {/* Content */}
        <div className="relative p-8 text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-2xl scale-110"></div>
            <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <Zap className="w-10 h-10 text-white fill-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">
            Get More Point
          </h2>
          <p className="text-sm text-gray-400 mb-8">
            Watch an ad to earn extra points
          </p>

          {/* Reward Info */}
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-2xl p-5 mb-8 border border-gray-800">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-white">Bonus Points</div>
                <div className="text-xs text-gray-500">Extra Rewards</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <span className="text-sm">Complete 5/5 for maximum bonus!</span>
            </div>
          </div>

          {/* Watch Ad Button */}
          <button
            onClick={onWatchAd}
            className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95"
          >
            Watch Ad
          </button>
        </div>
      </div>
    </div>
  );
}