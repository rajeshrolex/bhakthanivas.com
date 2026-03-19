import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus } from 'lucide-react';

const GuestDetailsModal = ({ isOpen, onClose, rooms, setRooms, guests, setGuests }) => {
    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const CounterRow = ({ label, value, onIncrement, onDecrement, min = 0, max = 20 }) => (
        <div className="flex items-center justify-between py-6 border-b border-gray-100 last:border-0">
            {/* Number on the left (as per screenshot) is actually just the logic from the screenshot:
                Room            - (+)
                Adults          - (+)
                Children        - (+)
                
                Wait, looking closely at the screenshot:
                "1     Room        (-)  (+)"
                "2     Adults      (-)  (+)"
                "0     Children    (-)  (+)"
            */}
            <div className="flex items-center gap-6">
                <span className="text-3xl font-light text-gray-900 w-8 tabular-nums">{value}</span>
                <span className="text-lg text-gray-700 font-medium">{label}</span>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onDecrement}
                    disabled={value <= min}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${value <= min
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                        }`}
                >
                    <Minus size={20} />
                </button>
                <button
                    onClick={onIncrement}
                    disabled={value >= max}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${value >= max
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                        }`}
                >
                    <Plus size={20} />
                </button>
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-gray-100">
                        <button onClick={onClose} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 absolute left-1/2 -translate-x-1/2">
                            Guest details
                        </h2>
                        <div className="w-10" /> {/* Spacer for centering */}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <CounterRow
                            label="Room"
                            value={rooms}
                            onDecrement={() => setRooms(Math.max(1, rooms - 1))}
                            onIncrement={() => setRooms(Math.min(10, rooms + 1))}
                            min={1}
                        />
                        <CounterRow
                            label="Guest"
                            value={guests}
                            onDecrement={() => setGuests(Math.max(1, guests - 1))}
                            onIncrement={() => setGuests(Math.min(30, guests + 1))}
                            min={1}
                        />
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-gray-100">
                        <button
                            onClick={onClose}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-full transition-all active:scale-[0.98] shadow-lg shadow-blue-200"
                        >
                            OK
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GuestDetailsModal;
