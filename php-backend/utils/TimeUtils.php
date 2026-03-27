<?php
/**
 * utils/TimeUtils.php – Time Utility Functions
 *
 * Mirrors Node.js timeUtils.js behavior exactly.
 *
 * Usage:
 *   $formatted = TimeUtils::formatTo12Hour('14:30'); // "2:30 PM"
 *   $result    = TimeUtils::calculateCheckOutTime($checkInDate, '12:00', $checkOutDate);
 */

declare(strict_types=1);

class TimeUtils
{
    /**
     * Format a 24-hour time string to 12-hour AM/PM format.
     *
     * @param  string $time24  Time in "HH:mm" format (e.g. "14:30")
     * @return string          Formatted time (e.g. "2:30 PM")
     */
    public static function formatTo12Hour(string $time24): string
    {
        if (empty($time24)) return '12:00 PM';

        $parts  = explode(':', $time24);
        $hour   = (int)($parts[0] ?? 12);
        $minute = $parts[1] ?? '00';
        $ampm   = $hour >= 12 ? 'PM' : 'AM';
        $hour12 = $hour % 12 ?: 12;

        return sprintf('%d:%s %s', $hour12, $minute, $ampm);
    }

    /**
     * Calculate the check-out time based on the 23-hour rule.
     *
     * Check-out time = check-in time − 1 hour (i.e. 23 hrs after check-in on final night).
     * Check-out date uses the given checkOutDate, or next day if not provided.
     *
     * @param  string      $checkInDate   Date string (YYYY-MM-DD)
     * @param  string      $checkInTime   Time in "HH:mm" format (default "12:00")
     * @param  string|null $checkOutDate  Date string (YYYY-MM-DD), nullable
     * @return array {
     *   checkOutTime   string  "HH:mm"
     *   checkOutTime12 string  "H:mm AM/PM"
     *   checkOutDate   string  "YYYY-MM-DD"
     * }
     */
    public static function calculateCheckOutTime(
        string $checkInDate,
        string $checkInTime = '12:00',
        ?string $checkOutDate = null
    ): array {
        try {
            // Parse check-in date + time
            [$hours, $minutes] = array_map('intval', explode(':', $checkInTime));
            $checkIn = new \DateTime($checkInDate);
            $checkIn->setTime($hours, $minutes, 0);

            // Calculate number of nights
            $nights = 1;
            if ($checkOutDate !== null) {
                $coDayStr = (new \DateTime($checkOutDate))->format('Y-m-d');
                $ciDayStr = (new \DateTime($checkInDate))->format('Y-m-d');
                $diff = (new \DateTime($ciDayStr))->diff(new \DateTime($coDayStr));
                if ($diff->days > 0) {
                    $nights = $diff->days;
                }
            }

            // Total stay = (nights × 24 – 1) hours
            $totalHours = $nights * 24 - 1;
            $checkOut   = clone $checkIn;
            $checkOut->modify("+{$totalHours} hours");

            $outTime24 = $checkOut->format('H:i');

            return [
                'checkOutTime'   => $outTime24,
                'checkOutTime12' => self::formatTo12Hour($outTime24),
                'checkOutDate'   => $checkOut->format('Y-m-d'),
                'nights'         => $nights,
            ];

        } catch (\Throwable $e) {
            error_log('calculateCheckOutTime error: ' . $e->getMessage());
            return [
                'checkOutTime'   => '11:00',
                'checkOutTime12' => '11:00 AM',
                'checkOutDate'   => $checkOutDate ?? date('Y-m-d', strtotime('+1 day', strtotime($checkInDate))),
                'nights'         => 1,
            ];
        }
    }
}
