import { useState } from 'react';
import { paymentAPI } from '../services/api';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY;
if (!RAZORPAY_KEY) {
    console.error('RAZORPAY_KEY is not defined in environment variables');
}

export const useRazorpay = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const initiatePayment = async (bookingDetails, onSuccess, onFailure) => {
        setLoading(true);
        setError(null);

        try {
            // Load Razorpay script first
            const isScriptLoaded = await loadRazorpayScript();
            if (!isScriptLoaded) {
                throw new Error('Razorpay SDK failed to load. Are you online?');
            }

            // Create order on backend
            const orderResponse = await paymentAPI.createOrder({
                amount: bookingDetails.totalAmount,
                bookingDetails: {
                    lodgeName: bookingDetails.lodgeName,
                    guestName: bookingDetails.guestName,
                    checkIn: bookingDetails.checkIn,
                    checkOut: bookingDetails.checkOut
                }
            });

            if (!orderResponse.success) {
                throw new Error(orderResponse.message || 'Failed to create order');
            }

            // Razorpay options
            const options = {
                key: orderResponse.keyId || RAZORPAY_KEY,
                amount: orderResponse.amount,
                currency: orderResponse.currency,
                name: 'Bhakta Nivas',
                description: `Booking at ${bookingDetails.lodgeName}`,
                order_id: orderResponse.orderId,
                handler: async function (response) {
                    try {
                        // Verify payment on backend
                        const verifyResponse = await paymentAPI.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyResponse.success) {
                            onSuccess && onSuccess({
                                paymentId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id
                            });
                        } else {
                            throw new Error('Payment verification failed');
                        }
                    } catch (err) {
                        setError(err.message);
                        onFailure && onFailure(err);
                    }
                },
                prefill: {
                    name: bookingDetails.guestName || '',
                    email: bookingDetails.email || '',
                    contact: bookingDetails.phone || ''
                },
                notes: {
                    lodgeName: bookingDetails.lodgeName,
                    checkIn: bookingDetails.checkIn,
                    checkOut: bookingDetails.checkOut
                },
                theme: {
                    color: '#f97316' // Orange primary color
                },
                config: {
                    display: {
                        blocks: {
                            uti: { // UPI/QR block
                                name: 'Pay via UPI/QR',
                                instruments: [
                                    {
                                        method: 'upi'
                                    }
                                ]
                            }
                        },
                        sequence: ['block.uti', 'card', 'netbanking', 'wallet'],
                        preferences: {
                            show_default_blocks: true
                        }
                    }
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                        onFailure && onFailure({ message: 'Payment cancelled by user' });
                    }
                }
            };

            if (!options.key) {
                throw new Error('Razorpay Key ID is missing. Please check configuration.');
            }

            // Open Razorpay checkout
            const razorpay = new window.Razorpay(options);
            razorpay.open();
            setLoading(false);

        } catch (err) {
            setError(err.message);
            setLoading(false);
            onFailure && onFailure(err);
        }
    };

    return {
        initiatePayment,
        loading,
        error
    };
};

export default useRazorpay;
