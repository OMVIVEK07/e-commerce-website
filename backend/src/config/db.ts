import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce';
    console.log(`[Database] Connecting to: ${connUri.replace(/:([^@:]+)@/, ':****@')}`);
    
    await mongoose.connect(connUri);
    console.log('[Database] MongoDB Connected Successfully.');
    
    // Synchronize indexes to ensure sparse unique constraints (e.g. googleId)
    try {
      const { User } = await import('../models/User');
      await User.syncIndexes();
    } catch (idxErr) {
      console.warn('[Database] Index sync notice:', idxErr);
    }
  } catch (error: any) {
    console.error('[Database] Connection Error:', error.message || error);
    console.warn('[Database] Proceeding without crashing. Please ensure MongoDB URI is correct and MongoDB server is active.');
  }
};
