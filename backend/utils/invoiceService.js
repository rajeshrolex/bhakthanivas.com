const PDFDocument = require('pdfkit');

/**
 * Generate a PDF invoice for a booking
 * @param {Object} bookingDetails - Details of the booking
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateInvoicePDF = (bookingDetails) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const leftMargin = 50;
        const rightMargin = 550;
        const width = rightMargin - leftMargin;

        // --- Header ---
        doc.font('Helvetica-Bold').fontSize(18).text('BhaktaNivas', { align: 'center' });
        doc.font('Helvetica').fontSize(12).text('Trusted stays for devotees', { align: 'center' });
        doc.text('Mantralayam', { align: 'center' });
        doc.moveDown(2);

        // --- Section Title ---
        doc.font('Helvetica-Bold').fontSize(14).text('Booking Invoice', leftMargin);
        doc.moveDown(0.5);

        // --- Table 1: Booking Details ---
        let currentY = doc.y;
        const rowHeight = 20;
        const colWidth = 150;

        const drawBorderedRow = (label, value) => {
            doc.rect(leftMargin, currentY, width, rowHeight).stroke();
            doc.rect(leftMargin, currentY, colWidth, rowHeight).stroke();
            doc.font('Helvetica').fontSize(10).text(label, leftMargin + 10, currentY + 6);
            doc.font('Helvetica').fontSize(10).text(value || '', leftMargin + colWidth + 10, currentY + 6);
            currentY += rowHeight;
        };

        drawBorderedRow('Invoice No', bookingDetails.bookingId);
        drawBorderedRow('Booking Date', bookingDetails.bookingDate);
        drawBorderedRow('Guest Name', bookingDetails.guestName);
        drawBorderedRow('Mobile No', bookingDetails.phone);
        drawBorderedRow('Lodge Name', bookingDetails.lodgeName);
        drawBorderedRow('Room Type', `${bookingDetails.roomType} (${bookingDetails.roomName})`);
        drawBorderedRow('Check-in', bookingDetails.checkIn);
        drawBorderedRow('Check-out', bookingDetails.checkOut);

        doc.moveDown(1.5);
        currentY = doc.y;

        // --- Table 2: Financials ---
        // Header
        const amountColWidth = 150;
        const descColWidth = width - amountColWidth;

        doc.rect(leftMargin, currentY, width, rowHeight).fillAndStroke('#E0E0E0', '#000000');
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10);
        doc.text('Description', leftMargin + 10, currentY + 6);
        doc.text('Amount (₹)', leftMargin + descColWidth + 10, currentY + 6);
        currentY += rowHeight;

        const drawFinancialRow = (label, value, isNegative = false) => {
            doc.rect(leftMargin, currentY, width, rowHeight).stroke();
            doc.rect(leftMargin, currentY, descColWidth, rowHeight).stroke();
            doc.font('Helvetica').fontSize(10).text(label, leftMargin + 10, currentY + 6);
            const valStr = isNegative ? `-${value}` : `${value}`;
            doc.text(valStr, leftMargin + descColWidth + 10, currentY + 6);
            currentY += rowHeight;
        };

        drawFinancialRow('Total Room Rent', bookingDetails.amount);
        drawFinancialRow('Advance Paid (Online)', bookingDetails.amountPaid, true);
        doc.font('Helvetica-Bold');
        drawFinancialRow('Balance Amount (Pay at Lodge)', bookingDetails.balanceAmount);

        doc.moveDown(1.5);
        currentY = doc.y;

        // --- Table 3: Payment Details ---
        const drawPaymentRow = (label, value) => {
            doc.rect(leftMargin, currentY, width, rowHeight).stroke();
            doc.rect(leftMargin, currentY, colWidth, rowHeight).stroke();
            doc.font('Helvetica').fontSize(10).text(label, leftMargin + 10, currentY + 6);
            doc.font('Helvetica').fontSize(10).text(value || '', leftMargin + colWidth + 10, currentY + 6);
            currentY += rowHeight;
        };

        const paymentModeStr = bookingDetails.paymentMethod === 'online' ? 'Online (Razorpay)' : 'Pay At Lodge';
        drawPaymentRow('Payment Mode', paymentModeStr);
        drawPaymentRow('UTR / Transaction ID', bookingDetails.paymentId || 'N/A');
        drawPaymentRow('Advance Payment Status', bookingDetails.paymentStatus.toUpperCase());
        drawPaymentRow('Balance Payment Status', 'PAY AT LODGE');

        doc.moveDown(1.5);

        // --- Notes ---
        doc.font('Helvetica').fontSize(10);
        doc.text('Advance amount is collected only to confirm the booking.', leftMargin);
        doc.text('Balance amount must be paid directly at the lodge during check-in.', leftMargin);
        doc.moveDown(2);

        // --- Footer ---
        doc.font('Helvetica').fontSize(10).text('Thank you for choosing BhaktaNivas', { align: 'center' });

        doc.end();
    });
};

module.exports = { generateInvoicePDF };
