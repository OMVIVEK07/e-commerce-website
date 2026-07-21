import mongoose from 'mongoose';

// Disable command buffering globally so offline DB queries fail immediately with fallbacks instead of timing out
mongoose.set('bufferCommands', false);

export const connectDB = async (): Promise<void> => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce';
    console.log(`[Database] Connecting to: ${connUri.replace(/:([^@:]+)@/, ':****@')}`);
    
    await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 3000,
    });
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
    console.warn('[Database] Proceeding with offline resilience mode active.');
  }
};
