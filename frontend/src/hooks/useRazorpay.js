import { useState } from 'react';
import { paymentAPI } from '../services/api';

const RAZORPAY_KEY = 'rzp_test_SDLqt0o7HljyuM';

export const useRazorpay = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const initiatePayment = async (bookingDetails, onSuccess, onFailure) => {
        setLoading(true);
        setError(null);

        try {
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
                key: RAZORPAY_KEY,
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
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                        onFailure && onFailure({ message: 'Payment cancelled by user' });
                    }
                }
            };

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
