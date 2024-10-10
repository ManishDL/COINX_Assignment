import mongoose from 'mongoose';

// Define schema for storing cryptocurrency data
const cryptoSchema = new mongoose.Schema({
    coin_name: {
        type: String,
        required: true
    },
    price_usd: {
        type: Number,
        required: true
    },
    market_cap_usd: {
        type: Number,
        required: true
    },
    change_24h: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create and export the CryptoPrice model
const CryptoPrice = mongoose.model('CryptoPrice', cryptoSchema);

export { CryptoPrice };
