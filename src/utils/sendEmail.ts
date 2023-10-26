const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

const sendOrderConfirmationEmail = async (email: string, orderId: string, products: any[], totalAmount: number) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Order Confirmation',
      html: `
        <p>Your order with ID ${orderId} has been placed successfully.</p>
        <p>Here are the details:</p>
        <ul>
          ${products.map(product => `<li>${product.quantity} x ${product.product.name} - $${product.unit_price}</li>`).join('')}
        </ul>
        <p>Total Amount: $${totalAmount}</p>
        <p>Thank you for shopping with us!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent.');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
