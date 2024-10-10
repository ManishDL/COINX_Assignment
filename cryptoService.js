import fetch from 'node-fetch';

// Function to fetch cryptocurrency data for Bitcoin, Matic, and Ethereum
const fetchCryptoData = async (retries = 3) => {
    const coinIds = ['bitcoin', 'matic-network', 'ethereum'];
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_market_cap=true&include_24hr_change=true`;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url);

            // Check if the response is OK (status 200)
            if (response.status === 429) {
                console.warn('Too many requests, retrying after a delay...');
                const retryAfter = response.headers.get('Retry-After') || 1; // Get the 'Retry-After' header or default to 1 second
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000)); // Wait for the specified time
                continue; // Retry the request
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Log the fetched data to see its structure
            console.log('Fetched data:', JSON.stringify(data, null, 2)); // Pretty print the data

            // Check if the necessary data exists before accessing it
            const bitcoin = data.bitcoin || {};
            const matic = data['matic-network'] || {};
            const ethereum = data.ethereum || {};

            // Check for missing data and log warnings
            if (!Object.keys(bitcoin).length) {
                console.warn('No data found for bitcoin');
            }
            if (!Object.keys(matic).length) {
                console.warn('No data found for matic');
            }
            if (!Object.keys(ethereum).length) {
                console.warn('No data found for ethereum');
            }

            // Construct the return object
            return {
                bitcoin: {
                    price_usd: bitcoin.usd || 0,
                    market_cap_usd: bitcoin.usd_market_cap || 0,
                    change_24h: bitcoin.usd_24h_change || 0
                },
                matic: {
                    price_usd: matic.usd || 0,
                    market_cap_usd: matic.usd_market_cap || 0,
                    change_24h: matic.usd_24h_change || 0
                },
                ethereum: {
                    price_usd: ethereum.usd || 0,
                    market_cap_usd: ethereum.usd_market_cap || 0,
                    change_24h: ethereum.usd_24h_change || 0
                }
            };
        } catch (error) {
            console.error('Error fetching data from CoinGecko:', error);
            return null; // Return null or handle error as needed
        }
    }

    console.error('Failed to fetch data after retries');
    return null; // If all retries failed
};

export { fetchCryptoData };
