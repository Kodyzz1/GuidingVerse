import mongoose from 'mongoose';
import 'dotenv/config'; // Ensure environment variables are loaded

const connectDB = async () => {
  try {
    // Check if MONGO_URI is loaded
    if (!process.env.MONGO_URI) {
      console.error('FATAL ERROR: MONGO_URI is not defined in .env file.');
      process.exit(1); // Exit process with failure code
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 6+ default options are generally good, but you can add specific ones here if needed
      // useNewUrlParser: true, // No longer needed
      // useUnifiedTopology: true, // No longer needed
      // useCreateIndex: true, // No longer supported
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit process with failure code on connection error
  }
};

export default connectDB; 