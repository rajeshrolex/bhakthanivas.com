/**
 * WhatsApp Service for booking notifications
 * Note: Requires an official API provider for automated push.
 * Currently provides console logging and can be extended with Twilio/Interakt/etc.
 */

const sendBookingNotification = async (bookingDetails) => {
    try {
        const { guestName, phone, bookingId, lodgeName, amountPaid, balanceAmount } = bookingDetails;
        
        // Clean phone number (remove non-digits, ensuring it starts with country code if needed)
        const cleanPhone = phone.replace(/\D/g, '');
        const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

        const message = `🙏 Namaste ${guestName}!
        
Your booking at *${lodgeName}* is confirmed.
Booking ID: ${bookingId}
Amount Paid: ₹${amountPaid}
Balance: ₹${balanceAmount}

Wishing you a blessed journey! 🙏`;

        // Log for now (where actual API call would happen)
        console.log(`[WHATSAPP NOTIFICATION] To: ${targetPhone}`);
        console.log(`Message: ${message}`);

        // If you want to provide a manual link to the admin, you can use:
        const waLink = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
        console.log(`Manual WhatsApp Link: ${waLink}`);

        return true;
    } catch (error) {
        console.error('Error in WhatsApp service:', error);
        return false;
    }
};

module.exports = { sendBookingNotification };
