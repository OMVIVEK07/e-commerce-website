import { Request, Response } from 'express';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Coupon } from '../models/Coupon';
import { Seller } from '../models/Seller';
import { User } from '../models/User';

export const seedDatabase = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[Seed Controller] Beginning database seeding process...');

    // 1. Clean existing records (Optional, let's keep users but clean catalog to avoid slug index collisions)
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});

    // Find or create a default seller to assign products to
    let sellerUser = await User.findOne({ role: 'seller' });
    if (!sellerUser) {
      sellerUser = await User.create({
        name: 'Default Merchant Pro',
        email: 'mock_seller@gmail.com',
        profilePic: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        googleId: 'mock_google_id_seller',
        role: 'seller',
      });
    }

    let sellerProfile = await Seller.findOne({ user: sellerUser._id });
    if (!sellerProfile) {
      sellerProfile = await Seller.create({
        user: sellerUser._id,
        companyName: 'Acme SuperStore Ltd.',
        phone: '9988776655',
        address: 'MG Road, Bangalore, KA, India',
        gstin: '29AAAAA1111A1Z1',
        bankDetails: {
          accountNumber: '1234567890',
          ifscCode: 'HDFC0000123',
          bankName: 'HDFC Bank',
        },
        isVerified: true,
      });
    } else if (!sellerProfile.isVerified) {
      sellerProfile.isVerified = true;
      await sellerProfile.save();
    }

    // 2. Create Categories
    const electronics = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=150',
    });

    const fashion = await Category.create({
      name: 'Fashion & Apparel',
      slug: 'fashion',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=150',
    });

    const home = await Category.create({
      name: 'Home & Kitchen',
      slug: 'home-appliances',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=150',
    });

    const books = await Category.create({
      name: 'Books & Stationery',
      slug: 'books',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150',
    });

    // 3. Create Products
    const productsData = [
      {
        name: 'iPhone 15 Pro Max (256 GB, Natural Titanium)',
        brand: 'Apple',
        description: 'Features a strong and light aerospace-grade titanium design. Powered by the industry-leading A17 Pro chip for next-level gaming and multi-tasking. Ultimate camera system with 5x Telephoto zoom.',
        price: 159900,
        discount: 7,
        stock: 15,
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500'],
        category: electronics._id,
        rating: 4.9,
        reviewsCount: 142,
        seller: sellerProfile._id,
        features: ['Aerospace-Grade Titanium', 'A17 Pro Chip', '48MP Main Camera', 'USB-C Support'],
        specifications: { Storage: '256 GB', Color: 'Natural Titanium', Weight: '221g' },
      },
      {
        name: 'Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones',
        brand: 'Sony',
        description: 'Industry-leading noise cancellation optimized automatically based on your wearing conditions. Crystal clear hands-free calling. Up to 30-hour battery life with quick charging.',
        price: 29990,
        discount: 13,
        stock: 22,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
        category: electronics._id,
        rating: 4.8,
        reviewsCount: 89,
        seller: sellerProfile._id,
        features: ['Auto NC Optimizer', '30-Hour Battery Life', 'Touch Controls', 'Speak-to-Chat'],
        specifications: { Type: 'Over-Ear', Connection: 'Bluetooth 5.2', Weight: '250g' },
      },
      {
        name: 'MacBook Pro 16-inch (M3 Max, 36GB Unified Memory)',
        brand: 'Apple',
        description: 'The ultimate laptop for power users. M3 Max chip with 16-core CPU and 40-core GPU. Liquid Retina XDR display with extreme dynamic range. Up to 22 hours of battery life.',
        price: 349900,
        discount: 5,
        stock: 8,
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500'],
        category: electronics._id,
        rating: 4.9,
        reviewsCount: 34,
        seller: sellerProfile._id,
        features: ['M3 Max Chip', '36GB Unified RAM', 'Liquid Retina XDR', 'MagSafe 3 Charging'],
        specifications: { ScreenSize: '16.2 inch', Storage: '1 TB SSD', Color: 'Space Black' },
      },
      {
        name: 'Nike Air Max Solo Running Sneakers',
        brand: 'Nike',
        description: 'Nike Air Max cushioning provides lightweight comfort and impact absorption. Breathable mesh construction keeps your feet cool and fresh throughout the day.',
        price: 8295,
        discount: 20,
        stock: 30,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
        category: fashion._id,
        rating: 4.4,
        reviewsCount: 56,
        seller: sellerProfile._id,
        features: ['Max Air Unit Cushioning', 'Breathable Mesh Upper', 'Durable Rubber Outsole'],
        specifications: { Style: 'Running / Casual', Color: 'Sport Red/Black', Size: 'UK 7, 8, 9, 10' },
      },
      {
        name: 'Puma Men Classic Fleece Crewneck Sweatshirt',
        brand: 'Puma',
        description: 'An absolute wardrobe essential. Made with soft fleece interior lining and cotton blend fabric for a snug, premium regular fit.',
        price: 2999,
        discount: 45,
        stock: 45,
        images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500'],
        category: fashion._id,
        rating: 4.2,
        reviewsCount: 18,
        seller: sellerProfile._id,
        features: ['Premium Cotton Blend', 'Ribbed Crew Collar', 'Machine Wash Friendly'],
        specifications: { Color: 'Heather Gray', Fit: 'Regular Fit', Material: '68% Cotton, 32% Polyester' },
      },
      {
        name: 'Smart Barista Automatic Espresso Maker',
        brand: 'Breville',
        description: 'Create third wave specialty coffee at home. Integrated grinder with 30 grind settings, powerful steam wand for manual microfoam milk texturing.',
        price: 74900,
        discount: 10,
        stock: 10,
        images: ['https://images.unsplash.com/photo-1517913967377-f499c6a1cf8d?w=500'],
        category: home._id,
        rating: 4.7,
        reviewsCount: 42,
        seller: sellerProfile._id,
        features: ['15 Bar Pressure Pump', 'ThermoJet Heating System', 'Hands-Free Grinding Cradle'],
        specifications: { WaterTank: '2.0 Liters', Finish: 'Brushed Stainless Steel', Power: '1680W' },
      },
      {
        name: 'Science Fiction Space Odyssey: The Star-Crossed Voyager',
        brand: 'CosmosPress',
        description: 'A thrilling sci-fi space odyssey hardback novel written by acclaimed author Dr. Sarah Chen. Explore distant galaxies and wormholes.',
        price: 799,
        discount: 0,
        stock: 120,
        images: ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500'],
        category: books._id,
        rating: 4.9,
        reviewsCount: 15,
        seller: sellerProfile._id,
        features: ['Hardcover Edition', 'Custom Artwork Sleeves', 'Includes Author Interview Notes'],
        specifications: { Format: 'Hardcover', Pages: '468 Pages', Language: 'English' },
      },
    ];

    await Product.insertMany(productsData);

    // 4. Create Coupons
    await Coupon.create([
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountAmount: 10,
        minPurchase: 1000,
        expiryDate: new Date('2027-12-31'),
        isActive: true,
      },
      {
        code: 'FLAT500',
        discountType: 'fixed',
        discountAmount: 500,
        minPurchase: 4999,
        expiryDate: new Date('2027-12-31'),
        isActive: true,
      },
    ]);

    console.log('[Seed Controller] Seeding completed successfully!');
    res.status(200).json({ success: true, message: 'Database catalog seeded successfully with electronics, fashion, and home models.' });
  } catch (error: any) {
    console.error('[Seed Controller Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Seeding failed' });
  }
};
