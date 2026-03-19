/**
 * Formats a 24-hour time string (HH:mm) into a 12-hour format (hh:mm AM/PM).
 * @param {string} timeStr - Time in "HH:mm" format.
 * @returns {string} Formatted time string.
 */
export const formatTo12Hour = (timeStr) => {
    if (!timeStr) return '12:00 PM';

    try {
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';

        h = h % 12;
        h = h ? h : 12; // the hour '0' should be '12'

        return `${h}:${minutes} ${ampm}`;
    } catch (error) {
        console.error('Error formatting time:', error);
        return timeStr;
    }
};

/**
 * Calculates checkout date and time.
 * For single-night: adds 23 hours from check-in.
 * For multi-night: stay is (nights * 24 - 1) hours, so checkout is always
 * 1 hour before the check-in time on the last day.
 *
 * @param {string|Date} checkInDate  - Check-in date (e.g. '2026-03-11') or Date object.
 * @param {string}      checkInTime  - Check-in time in "HH:mm" format (e.g. '01:45').
 * @param {string|Date} [checkOutDate] - Optional check-out date. Defaults to checkInDate + 1 day.
 * @returns {{ checkOutDate: Date, checkOutTime: string }}
 */
export const calculateCheckOutTime = (checkInDate, checkInTime = '12:00', checkOutDate = null) => {
    try {
        const [hours, minutes] = checkInTime.split(':').map(Number);

        // Build a Date from the checkIn date with the checkIn time applied
        const checkIn = new Date(checkInDate);
        checkIn.setHours(hours, minutes, 0, 0);

        // Determine number of nights
        let nights = 1;
        if (checkOutDate) {
            const coDay = new Date(checkOutDate);
            coDay.setHours(0, 0, 0, 0);
            const ciDay = new Date(checkInDate);
            ciDay.setHours(0, 0, 0, 0);
            const diffNights = Math.round((coDay - ciDay) / (1000 * 60 * 60 * 24));
            if (diffNights > 0) nights = diffNights;
        }

        // Total stay = (nights * 24 - 1) hours → checkout is 1 hr before check-in time on last day
        const totalHours = nights * 24 - 1;
        const checkOut = new Date(checkIn.getTime() + totalHours * 60 * 60 * 1000);

        const coHours = String(checkOut.getHours()).padStart(2, '0');
        const coMinutes = String(checkOut.getMinutes()).padStart(2, '0');

        return {
            checkOutDate: checkOut,
            checkOutTime: `${coHours}:${coMinutes}`
        };
    } catch (error) {
        console.error('Error calculating checkout time:', error);
        return {
            checkOutDate: null,
            checkOutTime: '11:00'
        };
    }
};
