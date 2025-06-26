import React from "react";

interface SimpleModalProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export const SimpleModal: React.FC<SimpleModalProps> = ({ open, onClose, children }) => {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                data-radix-dialog-content
                className="relative z-[1000] max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}; 