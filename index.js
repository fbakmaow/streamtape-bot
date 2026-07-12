const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Activate stealth plugin to bypass anti-bot protection mechanisms
puppeteer.use(StealthPlugin());

const app = express();
// Hostinger assigns a dynamic port, keeping process.env.PORT is mandatory
const PORT = process.env.PORT || 3000;

// Test route to verify the server status
app.get('/', (req, res) => {
    res.send('Streamtape Extractor API is running perfectly!');
});

// Main extraction endpoint for the mobile application requests
app.get('/extract', async (req, res) => {
    const embedUrl = req.query.url;

    if (!embedUrl) {
        return res.status(400).json({ error: "URL parameter 'url' is required." });
    }

    let browser = null;
    try {
        // Shared-hosting optimized browser launch configuration arguments
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        
        // Intercept network requests to block malicious popup and redirect ad servers
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const url = request.url();
            if (
                url.includes('chihuahuadoorstoppond.com') || 
                url.includes('doubleclick') || 
                url.includes('google-analytics') ||
                (url.includes('streamtape.com') === false && url !== 'about:blank')
            ) {
                request.abort(); // Abort the ad request chain execution
            } else {
                request.continue();
            }
        });

        // Navigate to target streamtape interface layer
        await page.goto(embedUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const playContainer = '.videocontainer, #olvideo, video';
        
        // Trigger initial click to bypass underlying invisible ad overlay masks
        await page.waitForSelector(playContainer, { timeout: 10000 });
        await page.click(playContainer);
        
        // Wait exactly 1.5 seconds before execution of second dynamic content generation click sequence
        await new Promise(resolve => setTimeout(resolve, 1500));
        await page.click(playContainer);

        // Evaluation loop sequence targeting internal absolute path generation components
        let absoluteRealUrl = null;
        let attempts = 0;

        while (attempts < 20) {
            absoluteRealUrl = await page.evaluate(() => {
                const video = document.querySelector('video');
                return video && video.src && video.src.includes('stream') ? video.src : null;
            });

            if (absoluteRealUrl) break;
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500)); // Poll every 500ms intervals
        }

        await browser.close();

        if (absoluteRealUrl) {
            // Return verified media absolute source path structures back to application layout
            res.json({ absoluteRealUrl: absoluteRealUrl });
        } else {
            res.status(404).json({ error: "Failed to extract real path from Streamtape within timeframe." });
        }

    } catch (error) {
        if (browser) await browser.close();
        console.error("Extraction error log:", error);
        res.status(500).json({ error: error.message });
    }
});

// Initialize configuration settings on listening port allocations
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
