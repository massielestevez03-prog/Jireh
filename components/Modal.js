import React from 'react';

const Modal = ({ isOpen, title, children, onClose, onConfirm, confirmText = "Aceptar", cancelText = "Cancelar", showCancel = true, isInput = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="bg-[#303F1D] px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl font-bold">&times;</button>
        </div>
        
        {/* Body */}
        <div className="p-6 text-gray-700">
            {children}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          {showCancel && (
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-bold text-white bg-[#303F1D] rounded hover:bg-[#232e15] shadow-lg transition-all active:scale-95"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
