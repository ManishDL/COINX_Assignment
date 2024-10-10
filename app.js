import express from 'express';
import mongoose from 'mongoose';
import {CryptoPrice} from "./model.js"
import  {fetchCryptoData} from './cryptoService.js';
import cron from 'cron';

const calculateStandardDeviation = (prices) => {
    if (prices.length === 0) return 0; // Return 0 for empty array

    // Calculate the mean
    const mean = prices.reduce((acc, price) => acc + price, 0) / prices.length;

    // Calculate the variance
    const variance = prices.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / prices.length;

    // Return the standard deviation
    return Math.sqrt(variance);
};


// MongoDB Connection
const dbUrl = 'mongodb://127.0.0.1:27017/cryptoDB'; // Replace with your MongoDB URL
mongoose.connect(dbUrl)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
    
const app = express();

app.get("/",(req,res)=>{
    res.send("Crypto App");
})
// Function to save cryptocurrency data to the MongoDB database
const saveCryptoData = async () => {
    const data = await fetchCryptoData();
    if (!data) return;

    const timestamp = new Date();

    // Save Bitcoin data
    await CryptoPrice.create({
        coin_name: 'bitcoin',
        price_usd: data.bitcoin.price_usd,
        market_cap_usd: data.bitcoin.market_cap_usd,
        change_24h: data.bitcoin.change_24h,
        timestamp: timestamp
    });

    // Save Matic data
    await CryptoPrice.create({
        coin_name: 'matic',
        price_usd: data.matic.price_usd,
        market_cap_usd: data.matic.market_cap_usd,
        change_24h: data.matic.change_24h,
        timestamp: timestamp
    });

    // Save Ethereum data
    await CryptoPrice.create({
        coin_name: 'ethereum',
        price_usd: data.ethereum.price_usd,
        market_cap_usd: data.ethereum.market_cap_usd,
        change_24h: data.ethereum.change_24h,
        timestamp: timestamp
    });

    console.log('Crypto data saved at', timestamp);
};

app.get('/stats', async (req, res) => {
    const { coin } = req.query; // Extract the coin from query params
    console.log(coin);
    if (!coin || !['bitcoin', 'ethereum', 'matic-network'].includes(coin)) {
        return res.status(400).json({ error: 'Invalid or missing coin parameter. Must be one of bitcoin, ethereum, or matic-network.' });
    }

    try {
        // Find the latest entry for the requested cryptocurrency
        const latestData = await CryptoPrice.findOne({ coin_name: coin }).sort({ timestamp: -1 });

        if (!latestData) {
            return res.status(404).json({ error: `No data found for ${coin}` });
        }

        // Return the latest price, market cap, and 24-hour change
        return res.json({
            price: latestData.price_usd,
            marketCap: latestData.market_cap_usd,
            "24hChange": latestData.change_24h
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

app.get('/deviation', async (req, res) => {
    const { coin } = req.query;

    if (!coin || !['bitcoin', 'ethereum', 'matic-network'].includes(coin)) {
        return res.status(400).json({ error: 'Invalid or missing coin parameter. Must be one of bitcoin, ethereum, or matic-network.' });
    }

    try {
        // Fetch the last 100 records for the specified coin
        const cryptoData = await CryptoPrice.find({ coin_name: coin })
            .sort({ timestamp: -1 })
            .limit(100);

        console.log(cryptoData , " Crypto Data");

        if (cryptoData.length === 0) {
            return res.status(404).json({ error: `No data found for ${coin}` });
        }

        // Extract the prices from the data
        const prices = cryptoData.map(record => record.price_usd);

        // Calculate the standard deviation
        const deviation = calculateStandardDeviation(prices);

        // Return the result
        return res.json({ deviation: deviation.toFixed(2) });
    } catch (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

// Schedule the job to run every 2 hours
const job = new cron.CronJob('0 */2 * * *', saveCryptoData, null, true, 'America/New_York');
job.start();

// Start Express server (optional, if you need an API)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
