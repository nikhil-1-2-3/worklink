import React, { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false
}: ConfirmDialogProps) {
  
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 pb-0">
          <div className="flex justify-between items-start mb-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              type === 'danger' && "bg-red-100 text-red-600",
              type === 'warning' && "bg-amber-100 text-amber-600",
              type === 'info' && "bg-blue-100 text-blue-600"
            )}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">{description}</p>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button 
            variant={type === 'danger' ? 'danger' : 'primary'} 
            onClick={onConfirm} 
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
