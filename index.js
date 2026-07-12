const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Activate stealth plugin to bypass anti-bot protection mechanisms
puppeteer.use(StealthPlugin());

const app = express();
// Dynamic port binding required for Render cloud platform
const PORT = process.env.PORT || 3000;

// Root endpoint to verify API application operational status
app.get('/', (req, res) => {
    res.send('Streamtape Extractor API is running perfectly!');
});

// Main extraction endpoint for mobile client applications
app.get('/extract', async (req, res) => {
    const embedUrl = req.query.url;

    if (!embedUrl) {
        return res.status(400).json({ error: "URL parameter 'url' is required." });
    }

    let browser = null;
    try {
        // High-performance launch arguments designed specifically for 512MB RAM constraints
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-zygote',
                '--single-process',
                '--disable-extensions'
            ]
        });

        const page = await browser.newPage();
        
        // Block external ad network tracking pixels and redirection frames
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const url = request.url();
            if (
                url.includes('chihuahuadoorstoppond.com') || 
                url.includes('doubleclick') || 
                url.includes('google-analytics') ||
                (url.includes('streamtape.com') === false && url !== 'about:blank')
            ) {
                request.abort(); // Intercept and terminate the ad connection request
            } else {
                request.continue();
            }
        });

        // Open target resource layout inside structural DOM framework
        await page.goto(embedUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const playContainer = '.videocontainer, #olvideo, video';
        
        // Execute primary target selector verification sequence
        await page.waitForSelector(playContainer, { timeout: 10000 });
        await page.click(playContainer);
        
        // Allocation break buffer before second operational action event
        await new Promise(resolve => setTimeout(resolve, 1500));
        await page.click(playContainer);

        // Polling sequence architecture to fetch standard dynamic source paths
        let absoluteRealUrl = null;
        let attempts = 0;

        while (attempts < 20) {
            absoluteRealUrl = await page.evaluate(() => {
                const video = document.querySelector('video');
                return video && video.src && video.src.includes('stream') ? video.src : null;
            });

            if (absoluteRealUrl) break;
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500)); // Poll at 500ms intervals
        }

        await browser.close();

        if (absoluteRealUrl) {
            // Dispatch validated response payloads back to application stack layouts
            res.json({ absoluteRealUrl: absoluteRealUrl });
        } else {
            res.status(404).json({ error: "Failed to extract real path from Streamtape within timeframe." });
        }

    } catch (error) {
        if (browser) await browser.close();
        console.error("Extraction execution fault:", error);
        res.status(500).json({ error: error.message });
    }
});

// Start processing input connections on mapped application interface lines
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
