import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { Review } from '../models/Review';
import { getAIRecommendations } from '../services/aiService';

// --- CATEGORIES ---
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().populate('parent');
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve categories' });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, parent, image } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const category = await Category.create({ name, slug, parent: parent || null, image });
    res.status(201).json({ success: true, category });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create category' });
  }
};

// --- PRODUCTS ---
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      discount,
      color,
      inStock,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const query: any = {};

    // 1. Text Search / Autocomplete
    if (search) {
      query.$or = [
        { name: { $regex: search.toString(), $options: 'i' } },
        { brand: { $regex: search.toString(), $options: 'i' } },
        { description: { $regex: search.toString(), $options: 'i' } },
      ];
    }

    // 2. Category Filter
    if (category) {
      // Safely check if value is valid ObjectId to prevent mongoose casting error
      const isObjectId = mongoose.Types.ObjectId.isValid(category.toString());
      const catQuery = isObjectId
        ? { _id: category.toString() }
        : { slug: category.toString() };
      const cat = await Category.findOne(catQuery);
      if (cat) {
        query.category = cat._id;
      }
    }

    // 3. Brand Filter
    if (brand) {
      query.brand = { $regex: brand.toString(), $options: 'i' };
    }

    // 4. Price Filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 5. Rating Filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // 6. Discount Filter
    if (discount) {
      query.discount = { $gte: Number(discount) };
    }

    // 7. Color Filter
    if (color) {
      query['variants.color'] = { $regex: color.toString(), $options: 'i' };
    }

    // 8. Availability Filter
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // 9. Sorting
    let sortQuery: any = { createdAt: -1 }; // default newest
    if (sort) {
      switch (sort.toString()) {
        case 'price-asc':
          sortQuery = { price: 1 };
          break;
        case 'price-desc':
          sortQuery = { price: -1 };
          break;
        case 'popularity':
          sortQuery = { reviewsCount: -1 };
          break;
        case 'rating':
          sortQuery = { rating: -1 };
          break;
        case 'newest':
        default:
          sortQuery = { createdAt: -1 };
          break;
      }
    }

    // 10. Pagination
    const skipCount = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortQuery)
      .skip(skipCount)
      .limit(Number(limit))
      .populate('seller', 'companyName rating');

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (error) {
    console.error('[Get Products Error]:', error);
    res.status(500).json({ success: false, message: 'Error retrieving products' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate({
        path: 'seller',
        select: 'companyName description rating user',
        populate: { path: 'user', select: 'name profilePic' }
      });

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Retrieve reviews
    const reviews = await Review.find({ product: product._id })
      .populate('user', 'name profilePic')
      .sort({ createdAt: -1 });

    // Retrieve related products in same category
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
    }).limit(4);

    res.status(200).json({
      success: true,
      product,
      reviews,
      relatedProducts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving product details' });
  }
};

export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const recommendations = await getAIRecommendations(userId);
    res.status(200).json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate recommendations' });
  }
};

// --- REVIEWS ---
export const addProductReview = async (req: any, res: Response): Promise<void> => {
  try {
    const { rating, comment, photos, videos } = req.body;
    const productId = req.params.id;
    const userId = req.user.id;

    // Check if user already reviewed
    const existing = await Review.findOne({ product: productId, user: userId });
    if (existing) {
      res.status(400).json({ success: false, message: 'You have already reviewed this product' });
      return;
    }

    // Create review
    const review = await Review.create({
      product: productId,
      user: userId,
      rating: Number(rating),
      comment,
      photos: photos || [],
      videos: videos || [],
    });

    // Update product average rating & reviewsCount
    const reviews = await Review.find({ product: productId });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: Number(avgRating.toFixed(1)),
      reviewsCount: reviews.length,
    });

    res.status(201).json({ success: true, review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to submit review' });
  }
};

export const markReviewHelpful = async (req: any, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    const userId = req.user._id;
    const index = review.helpfulUsers.indexOf(userId);

    if (index === -1) {
      review.helpfulUsers.push(userId);
    } else {
      // Toggle off
      review.helpfulUsers.splice(index, 1);
    }

    await review.save();
    res.status(200).json({ success: true, helpfulCount: review.helpfulUsers.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update helpful state' });
  }
};

// --- PINCODE & SEARCH SUGGESTIONS ---
export const checkPincode = async (req: Request, res: Response): Promise<void> => {
  try {
    const pincode = (req.query.pincode || req.body.pincode || '').toString();
    const { checkPincodeServiceability } = await import('../services/pincodeService');
    const result = checkPincodeServiceability(pincode);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to validate pincode' });
  }
};

export const getSearchSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q || q.length < 2) {
      res.status(200).json({ success: true, suggestions: [], categories: [] });
      return;
    }

    const regex = new RegExp(q, 'i');

    const [suggestions, categories] = await Promise.all([
      Product.find({
        $or: [{ name: regex }, { brand: regex }],
      })
        .select('name brand price discount images rating')
        .limit(6),
      Category.find({ name: regex }).select('name slug').limit(3),
    ]);

    res.status(200).json({ success: true, suggestions, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch suggestions' });
  }
};
