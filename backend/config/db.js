const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        console.log('✅ MongoDB Connected (Cached)');
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            // bufferCommands: true, // Default is true, enabling buffering for serverless cold starts
        };

        console.log('⏳ Connecting to MongoDB...');
        cached.promise = mongoose.connect(process.env.DATABASE_URL, opts).then((mongoose) => {
            console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
            return mongoose;
        }).catch(error => {
            console.error(`❌ MongoDB Connection Error: ${error.message}`);
            throw error;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
};

module.exports = { connectDB };