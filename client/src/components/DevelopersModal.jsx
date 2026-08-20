import React from 'react';
import { X, Github, Code2 } from 'lucide-react';
import developers from '../data/developers.json';

const DevelopersModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/5 rounded-2xl text-emerald-400 border border-white/5">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Meet the Developers
              </h2>
              <p className="text-xs text-gray-400">The Minds Building K-Forum</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Developers List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 custom-scrollbar">
          {developers.map((dev) => (
            <div
              key={dev.id}
              className="bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-2xl p-4 transition-all duration-200 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate">
                  {dev.name}
                </h3>
                <p className="text-xs text-emerald-400 font-medium truncate mt-0.5">
                  {dev.designation}
                </p>
              </div>

              <a
                href={dev.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all active:scale-95 shrink-0 border border-white/5"
                title={`${dev.name}'s GitHub`}
                aria-label={`${dev.name}'s GitHub Profile`}
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-white/10 text-center shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-sm font-semibold transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevelopersModal;
