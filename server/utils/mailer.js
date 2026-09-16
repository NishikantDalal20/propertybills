import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendInvoiceEmail(to, pdfBuffer, invoiceNumber) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `Invoice ${invoiceNumber}`,
    text: 'Please find your invoice attached.',
    attachments: [{ filename: `${invoiceNumber}.pdf`, content: pdfBuffer }]
  });
}
