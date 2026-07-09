import { Product } from '../models/Product';

export const getAIChatResponse = async (userMessage: string): Promise<string> => {
  const query = userMessage.toLowerCase();

  // Call Groq API if key is present
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'mock_key') {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are an intelligent AI chatbot assistant for ShopCraft, a premium e-commerce site. Answer questions about orders, shipping, payment methods (Stripe/Razorpay), return policies, or seller setup. Keep answers brief, helpful, and polite.'
            },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 250
        })
      });
      const data = await response.json() as any;
      if (data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
    } catch (err) {
      console.error('[AI Chat Service] Groq error, falling back to local chatbot:', err);
    }
  }

  // Basic FAQs (Fallback)
  if (query.includes('return') || query.includes('refund')) {
    return 'Our return policy allows items to be returned or replaced within 7-10 days of delivery. To request a return, visit your "Orders" tab in your profile dashboard, select your order, and click "Return Order". Once the seller verifies the item, refunds are processed back to Stripe or Razorpay automatically within 3-5 business days.';
  }

  if (query.includes('shipping') || query.includes('delivery')) {
    return 'Standard delivery takes between 3 to 5 business days depending on your location. Shipping charges are calculated at checkout based on package weight and location. You can track your packages in real-time under the "Orders" page.';
  }

  if (query.includes('payment') || query.includes('upi') || query.includes('card')) {
    return 'We support secure payment checkouts using Stripe (for credit/debit cards) and Razorpay (supporting UPI, Google Pay, Net Banking, and popular wallets like Paytm or PhonePe).';
  }

  if (query.includes('seller') || query.includes('sell')) {
    return 'To become a seller, go to your profile dropdown, select "Seller Panel", and submit your company name, GSTIN, phone, and banking details. Once the Admin verifies your verification request, you can instantly upload products and manage catalogs!';
  }

  if (query.includes('admin') || query.includes('role')) {
    return 'Admins manage moderation and overrides. They approve/verify seller registrations, block malicious users, handle billing refunds, review statistics, and monitor overall store analytics.';
  }

  if (query.includes('discount') || query.includes('coupon') || query.includes('promo')) {
    return 'You can apply promo coupons during checkout in your Cart. Enter a valid coupon code (e.g., WELCOME10) to deduct percentages or flat rates from your billing subtotal.';
  }

  if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
    return 'Hello! I am your AI assistant. How can I help you today? I can answer questions about orders, payments, shipping, return policies, or seller setup.';
  }

  // Attempt to scan for keywords and query matching products
  if (query.includes('search') || query.includes('buy') || query.includes('product')) {
    try {
      const matchWord = query.replace('search', '').replace('buy', '').replace('product', '').trim();
      if (matchWord.length > 2) {
        const products = await Product.find({ name: { $regex: matchWord, $options: 'i' } }).limit(2);
        if (products.length > 0) {
          const names = products.map((p) => `${p.name} (Brand: ${p.brand}, Price: INR ${p.price})`).join(', ');
          return `I found some items matching your inquiry: ${names}. You can search for them using our search bar!`;
        }
      }
    } catch (err) {
      // Fallback
    }
  }

  return "I'm sorry, I didn't quite get that. Could you ask about orders, returns, payment methods, seller registration, or search keywords?";
};

export const getAIRecommendations = async (userId?: string, categoryLimit: number = 4): Promise<any[]> => {
  try {
    // If user is logged in, recommend products based on top-rated products or recent items
    // Since we want standard recommendations, we fetch top-rated products from catalog
    const recommendations = await Product.find({ rating: { $gte: 4 } })
      .sort({ reviewsCount: -1 })
      .limit(categoryLimit);
    return recommendations;
  } catch (error) {
    console.error('[AI Recommendation Engine Error]:', error);
    return [];
  }
};
