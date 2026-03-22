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
 * Safely parses a date string or Date object into a local Date at midnight.
 * Prevents "one day off" errors caused by UTC/Local time conversions.
 * @param {string|Date} d - Date input.
 * @returns {Date} Date object at local midnight.
 */
export const parseSafeDate = (d) => {
    if (!d) return new Date();
    if (d instanceof Date) return d;
    
    try {
        // Extract YYYY-MM-DD part only
        const datePart = d.toString().split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        
        if (!year || !month || !day) return new Date(d); // Fallback
        
        // Month is 0-indexed in JS Date constructor
        return new Date(year, month - 1, day);
    } catch (e) {
        console.error('Error in parseSafeDate:', e);
        return new Date(d);
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
        const checkIn = parseSafeDate(checkInDate);
        checkIn.setHours(hours, minutes, 0, 0);

        // Determine number of nights
        let nights = 1;
        if (checkOutDate) {
            const coDay = parseSafeDate(checkOutDate);
            const ciDay = parseSafeDate(checkInDate);
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
