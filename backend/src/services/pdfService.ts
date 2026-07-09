import PDFDocument from 'pdfkit';
import { IOrder } from '../models/Order';

export const generateInvoicePDF = (order: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // 1. Header (Logo / Company Info)
      doc.fillColor('#0F172A').fontSize(24).text('SHOPCRAFT INC.', 50, 45);
      doc.fontSize(10).fillColor('#64748B')
         .text('123 Enterprise Way, Tech Park', 50, 75)
         .text('Bangalore, KA, 560001, India', 50, 90)
         .text('GSTIN: 29AAAAA1111A1Z1', 50, 105);

      doc.fontSize(20).fillColor('#0F172A').text('INVOICE', 400, 45, { align: 'right' });
      doc.fontSize(10).fillColor('#64748B')
         .text(`Invoice No: INV-${order._id.toString().substring(18).toUpperCase()}`, 400, 75, { align: 'right' })
         .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 90, { align: 'right' })
         .text(`Payment: ${order.paymentMethod.toUpperCase()}`, 400, 105, { align: 'right' });

      // Divider Line
      doc.moveTo(50, 130).lineTo(550, 130).strokeColor('#E2E8F0').stroke();

      // 2. Billing & Shipping Addresses
      doc.fontSize(12).fillColor('#0F172A').text('Bill To:', 50, 150);
      doc.fontSize(10).fillColor('#475569')
         .text(order.billingAddress.name, 50, 170)
         .text(order.billingAddress.streetAddress, 50, 185)
         .text(`${order.billingAddress.city}, ${order.billingAddress.state} - ${order.billingAddress.postalCode}`, 50, 200)
         .text(`Phone: ${order.billingAddress.phone}`, 50, 215);

      doc.fontSize(12).fillColor('#0F172A').text('Ship To:', 300, 150);
      doc.fontSize(10).fillColor('#475569')
         .text(order.shippingAddress.name, 300, 170)
         .text(order.shippingAddress.streetAddress, 300, 185)
         .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`, 300, 200)
         .text(`Phone: ${order.shippingAddress.phone}`, 300, 215);

      // Divider Line
      doc.moveTo(50, 240).lineTo(550, 240).strokeColor('#E2E8F0').stroke();

      // 3. Table Header
      let y = 260;
      doc.fontSize(10).fillColor('#0F172A')
         .text('Product Description', 50, y, { width: 220 })
         .text('Price (INR)', 280, y, { width: 80, align: 'right' })
         .text('Qty', 370, y, { width: 40, align: 'center' })
         .text('GST (18%)', 420, y, { width: 60, align: 'right' })
         .text('Total (INR)', 490, y, { width: 60, align: 'right' });

      // Table Header Underline
      doc.moveTo(50, y + 15).lineTo(550, y + 15).strokeColor('#0F172A').stroke();
      y += 25;

      // 4. Products List
      order.items.forEach((item: any) => {
        // Fallback for populated product name
        const productName = item.product?.name || 'Standard E-Commerce Product';
        const price = item.price;
        const qty = item.quantity;
        const itemGST = (price * qty * 0.18).toFixed(2);
        const total = (price * qty * 1.18).toFixed(2);

        doc.fontSize(9).fillColor('#475569')
           .text(productName, 50, y, { width: 220 })
           .text(price.toFixed(2), 280, y, { width: 80, align: 'right' })
           .text(qty.toString(), 370, y, { width: 40, align: 'center' })
           .text(itemGST, 420, y, { width: 60, align: 'right' })
           .text(total, 490, y, { width: 60, align: 'right' });

        y += 25;
      });

      // Divider Line
      doc.moveTo(50, y).lineTo(550, y).strokeColor('#E2E8F0').stroke();
      y += 15;

      // 5. Order Totals
      const subtotal = order.grandTotal - order.gst - order.shippingCharges + order.discountAmount;
      doc.fontSize(10).fillColor('#475569')
         .text('Subtotal:', 350, y, { width: 120, align: 'right' })
         .text(subtotal.toFixed(2), 480, y, { width: 70, align: 'right' });
      y += 15;

      if (order.discountAmount > 0) {
        doc.text('Discount Applied:', 350, y, { width: 120, align: 'right' })
           .text(`-${order.discountAmount.toFixed(2)}`, 480, y, { width: 70, align: 'right' });
        y += 15;
      }

      doc.text('GST Tax (18%):', 350, y, { width: 120, align: 'right' })
         .text(order.gst.toFixed(2), 480, y, { width: 70, align: 'right' });
      y += 15;

      doc.text('Shipping Charges:', 350, y, { width: 120, align: 'right' })
         .text(order.shippingCharges.toFixed(2), 480, y, { width: 70, align: 'right' });
      y += 20;

      doc.fontSize(12).fillColor('#0F172A')
         .text('Grand Total:', 350, y, { width: 120, align: 'right' })
         .text(`INR ${order.grandTotal.toFixed(2)}`, 480, y, { width: 70, align: 'right' });

      // 6. Footer Terms
      doc.fontSize(9).fillColor('#94A3B8')
         .text('Thank you for shopping with ShopCraft!', 50, 700, { align: 'center' })
         .text('This is a computer generated invoice and does not require an physical signature.', 50, 715, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
