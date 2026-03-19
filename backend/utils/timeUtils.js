/**
 * Format 24h time string to 12h format with AM/PM
 * @param {string} time24 - Time in "HH:mm" format
 * @returns {string} - Formatted time like "12:00 PM"
 */
const formatTo12Hour = (time24) => {
    if (!time24) return '12:00 PM';
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${minutes} ${ampm}`;
};

/**
 * Calculate check-out time and date.
 * Check-out time = check-in time - 1 hour (i.e. 23 hrs after check-in on final night).
 * Check-out DATE uses the actual checkOut date if provided, otherwise next day.
 *
 * @param {string|Date} checkInDate  - Check-in date (ISO string or Date)
 * @param {string}      checkInTime  - Time in "HH:mm" format (e.g. "12:00")
 * @param {string|Date} [checkOutDate] - Actual check-out date (ISO string or Date). If given, used as check-out date.
 * @returns {{ checkOutTime: string, checkOutDate: Date, checkOutTime12: string }}
 */
const calculateCheckOutTime = (checkInDate, checkInTime = '12:00', checkOutDate = null) => {
    try {
        const [hours, minutes] = checkInTime.split(':').map(Number);
        const checkIn = new Date(checkInDate);
        checkIn.setHours(hours, minutes, 0, 0);

        // Determine nights
        let nights = 1;
        if (checkOutDate) {
            const coDay = new Date(checkOutDate);
            coDay.setHours(0, 0, 0, 0);
            const ciDay = new Date(checkInDate);
            ciDay.setHours(0, 0, 0, 0);
            const diffNights = Math.round((coDay - ciDay) / (1000 * 60 * 60 * 24));
            if (diffNights > 0) nights = diffNights;
        }

        // Total stay = (nights * 24 - 1) hours
        const totalHours = nights * 24 - 1;
        const checkOut = new Date(checkIn.getTime() + totalHours * 60 * 60 * 1000);

        const coHours = String(checkOut.getHours()).padStart(2, '0');
        const coMinutes = String(checkOut.getMinutes()).padStart(2, '0');
        const outTimeStr = `${coHours}:${coMinutes}`;

        return {
            checkOutTime: outTimeStr,
            checkOutTime12: formatTo12Hour(outTimeStr),
            checkOutDate: checkOut
        };
    } catch (error) {
        console.error('Error calculating checkout time:', error);
        return {
            checkOutTime: '11:00',
            checkOutTime12: '11:00 AM',
            checkOutDate: checkOutDate ? new Date(checkOutDate) : new Date()
        };
    }
};

module.exports = { formatTo12Hour, calculateCheckOutTime };
