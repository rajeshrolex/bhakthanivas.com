const nodemailer = require('nodemailer');
const { formatTo12Hour } = require('./timeUtils');

// Create transporter with Gmail SMTP
const createTransporter = () => {
    console.log('Creating email transporter...');
    console.log('SMTP Email:', process.env.SMTP_EMAIL);
    console.log('SMTP Password set:', process.env.SMTP_PASSWORD ? 'Yes' : 'No');

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: process.env.SMTP_PORT || 465,
        secure: true,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });
};

// Send booking confirmation to guest
const sendGuestConfirmation = async (bookingDetails) => {
    try {
        const transporter = createTransporter();

        const totalAmount = bookingDetails.amount;
        const amountPaid = bookingDetails.amountPaid || 0;
        const balanceAmount = bookingDetails.balanceAmount || 0;
        const hasPartialPayment = amountPaid > 0 && balanceAmount > 0;
        const isFullyPaid = amountPaid === totalAmount && balanceAmount === 0;
        const isPayAtLodge = amountPaid === 0 && balanceAmount === totalAmount;

        // Payment status section based on payment breakdown
        let paymentSection = `
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">Total Amount:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">₹${totalAmount}</td>
            </tr>
        `;

        if (amountPaid > 0) {
            paymentSection += `
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Paid Online:</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #16a34a;">₹${amountPaid} ✅</td>
                </tr>
            `;
        }

        if (balanceAmount > 0) {
            paymentSection += `
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Balance Due at Lodge:</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #dc2626;">₹${balanceAmount} 💰</td>
                </tr>
            `;
        }

        if (isFullyPaid) {
            paymentSection += `
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Payment ID:</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingDetails.paymentId || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Payment Status:</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #16a34a;">✅ FULLY PAID</td>
                </tr>
            `;
        } else {
            paymentSection += `
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Payment Status:</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #f59e0b;">⏳ PENDING</td>
                </tr>
            `;
        }

        // Payment reminder for balance due
        const paymentReminder = balanceAmount > 0 ? `
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>💰 Balance Payment Required at Check-in:</strong><br>
                    Please pay remaining <strong>₹${balanceAmount}</strong> via Cash or UPI at the lodge during check-in.
                </p>
            </div>
        ` : '';

        const mailOptions = {
            from: `"BhaktaNivas" <${process.env.SMTP_EMAIL}>`,
            to: bookingDetails.email,
            subject: balanceAmount > 0
                ? `🙏 Booking Reserved (Balance ₹${balanceAmount} Due) - ${bookingDetails.lodgeName}`
                : `🙏 Booking Confirmed - ${bookingDetails.lodgeName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; text-align: center;">🙏 ${isFullyPaid ? 'Booking Confirmed!' : 'Booking Reserved!'}</h1>
                    </div>
                    
                    <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                        <p style="font-size: 16px; color: #374151;">Dear <strong>${bookingDetails.guestName}</strong>,</p>
                        
                        <p style="color: #6b7280;">Your booking at <strong>${bookingDetails.lodgeName}</strong> has been ${isFullyPaid ? 'confirmed' : 'reserved'}.</p>
                        
                        ${paymentReminder}
                        
                        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin: 0 0 15px 0; color: #1f2937;">Booking Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280;">Booking ID:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingDetails.bookingId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280;">Room:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingDetails.roomName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280;">Check-in:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingDetails.checkIn} at ${formatTo12Hour(bookingDetails.checkInTime || '12:00')}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280;">Check-out:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingDetails.checkOut} at ${bookingDetails.checkOutTime || '11:00 AM'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280;">Guests:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingDetails.guests}</td>
                                </tr>
                                ${paymentSection}
                            </table>
                        </div>
                        
                        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; color: #92400e; font-size: 14px;">
                                <strong>📍 Check-in Time:</strong> ${formatTo12Hour(bookingDetails.checkInTime || '12:00')} | <strong>Check-out Time:</strong> ${bookingDetails.checkOutTime || '11:00 AM'}<br>
                                Please carry a valid ID proof (Aadhar/Passport/DL).
                            </p>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${bookingDetails.baseUrl}/api/bookings/${bookingDetails.bookingId}/invoice" 
                               style="background: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                                📄 Download Invoice PDF
                            </a>
                            <p style="color: #6b7280; font-size: 12px; margin-top: 8px;">Click here to download your official receipt</p>
                        </div>
                        
                        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
                            <p style="margin: 0 0 10px 0; color: #166534; font-weight: bold; font-size: 15px;">📞 Lodge Contact Details</p>
                            ${bookingDetails.lodgePhone ? `
                            <p style="margin: 0 0 5px 0; color: #374151; font-size: 14px;">
                                📱 Call: <a href="tel:${bookingDetails.lodgePhone.replace(/\s/g, '')}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${bookingDetails.lodgePhone}</a>
                            </p>` : ''}
                            ${bookingDetails.lodgeWhatsapp ? `
                            </p>` : ''}
                        </div>

                        <!-- Terms & Conditions Section -->
                        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                            <h4 style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">📜 Terms & Conditions</h4>
                            <div style="color: #6b7280; font-size: 12px; line-height: 1.5; white-space: pre-wrap;">
                                ${bookingDetails.terms || 'Standard terms and conditions apply.'}
                            </div>
                        </div>
                        
                        <p style="color: #f97316; font-size: 16px; text-align: center; margin-top: 30px;">
                            🙏 Wishing you a blessed spiritual journey! 🙏
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Guest confirmation email sent to:', bookingDetails.email);
        return true;
    } catch (error) {
        console.error('Error sending guest confirmation email:', error);
        return false;
    }
};

// Send notification to Lodge Admin
const sendAdminNotification = async (bookingDetails) => {
    try {
        const transporter = createTransporter();

        // Use lodge admin email if available, otherwise use default admin email
        const adminEmail = bookingDetails.lodgeAdminEmail || process.env.ADMIN_EMAIL;

        const totalAmount = bookingDetails.amount;
        const amountPaid = bookingDetails.amountPaid || 0;
        const balanceAmount = bookingDetails.balanceAmount || 0;
        const isFullyPaid = amountPaid === totalAmount && balanceAmount === 0;
        const isPayAtLodge = amountPaid === 0 && balanceAmount === totalAmount;

        // Payment status section based on payment breakdown
        let paymentStatusHtml = `
            <div style="background: ${isFullyPaid ? '#f0fdf4' : '#fef3c7'}; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${isFullyPaid ? '#16a34a' : '#f59e0b'};">
                <p style="margin: 0; color: ${isFullyPaid ? '#16a34a' : '#92400e'}; font-weight: bold; font-size: 18px;">
                    ${isFullyPaid ? '✅' : '⏳'} Total Amount: ₹${totalAmount}
                </p>
        `;

        if (amountPaid > 0) {
            paymentStatusHtml += `
                <p style="margin: 5px 0 0 0; color: #16a34a; font-size: 16px;">
                    ✅ Paid Online: ₹${amountPaid}
                </p>
            `;
        }

        if (balanceAmount > 0) {
            paymentStatusHtml += `
                <p style="margin: 5px 0 0 0; color: #dc2626; font-weight: bold; font-size: 16px;">
                    💰 Balance to Collect: ₹${balanceAmount}
                </p>
                <p style="margin: 5px 0 0 0; color: #92400e; font-size: 14px;">
                    Collect this amount (Cash/UPI) at check-in
                </p>
            `;
        }

        paymentStatusHtml += `
            </div>
        `;

        const mailOptions = {
            from: `"BhaktaNivas System" <${process.env.SMTP_EMAIL}>`,
            to: adminEmail,
            subject: balanceAmount > 0
                ? `🔔 New Booking (Balance ₹${balanceAmount} to Collect) - ${bookingDetails.lodgeName}`
                : `🔔 New Booking (Fully Paid) - ${bookingDetails.lodgeName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; text-align: center;">🔔 New Booking Received!</h1>
                    </div>
                    
                    <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                        ${paymentStatusHtml}
                        
                        <h3 style="color: #1f2937; margin-bottom: 15px;">Guest Information</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Name:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingDetails.guestName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Phone:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingDetails.phone}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingDetails.email || 'N/A'}</td>
                            </tr>
                        </table>
                        
                        <h3 style="color: #1f2937; margin-bottom: 15px;">Booking Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Booking ID:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingDetails.bookingId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Lodge:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingDetails.lodgeName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Room:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingDetails.roomName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Check-in:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingDetails.checkIn} at ${formatTo12Hour(bookingDetails.checkInTime || '12:00')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Check-out:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingDetails.checkOut} at ${bookingDetails.checkOutTime || '11:00 AM'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Guests:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingDetails.guests}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Payment Method:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${isPayAtLodge ? 'Pay at Lodge (Cash/UPI)' : 'Online (UPI)'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Payment ID:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingDetails.paymentId || 'N/A'}</td>
                            </tr>
                        </table>

                        <div style="background: #f8fafc; padding: 10px; border-radius: 5px; margin-top: 15px;">
                            <p style="margin: 0; font-size: 12px; color: #64748b;">
                                <strong>Terms agreed by guest:</strong><br>
                                ${bookingDetails.terms ? bookingDetails.terms.substring(0, 150) + '...' : 'Standard terms applied.'}
                            </p>
                        </div>
                        
                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
                            This is an automated notification from BhaktaNivas Booking System
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Admin notification email sent to:', adminEmail);
        return true;
    } catch (error) {
        console.error('Error sending admin notification email:', error);
        return false;
    }
};

// Send both emails
const sendBookingEmails = async (bookingDetails) => {
    const results = await Promise.all([
        sendGuestConfirmation(bookingDetails),
        sendAdminNotification(bookingDetails)
    ]);

    return {
        guestEmailSent: results[0],
        adminEmailSent: results[1]
    };
};

module.exports = {
    sendGuestConfirmation,
    sendAdminNotification,
    sendBookingEmails
};
