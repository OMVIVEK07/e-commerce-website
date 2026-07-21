import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce';
    console.log(`[Database] Connecting to: ${connUri.replace(/:([^@:]+)@/, ':****@')}`);
    
    await mongoose.connect(connUri);
    console.log('[Database] MongoDB Connected Successfully.');
    
    // Synchronize indexes to ensure sparse unique constraints (e.g. googleId)
    const { User } = await import('../models/User');
    await User.syncIndexes();
  } catch (error) {
    console.error('[Database] Connection Error:', error);
    process.exit(1);
  }
};
