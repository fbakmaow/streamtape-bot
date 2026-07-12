const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs'); // Added to check for available browser paths

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

// Function to find the available browser path on Hostinger Linux server
function getExecutablePath() {
    const possiblePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/usr/bin/chrome'
    ];

    for (const path of possiblePaths) {
        if (fs.existsSync(path)) {
            return path;
        }
    }
    return null; // Return null if no path is found, letting puppeteer try its default
}

app.get('/', (req, res) => {
    res.send('Streamtape Extractor API is running perfectly!');
});

app.get('/extract', async (req, res) => {
    const embedUrl = req.query.url;

    if (!embedUrl) {
        return res.status(400).json({ error: "URL parameter 'url' is required." });
    }

    let browser = null;
    try {
        const chromePath = getExecutablePath();
        
        // Hostinger optimized launch configurations
        browser = await puppeteer.launch({
            headless: true,
            executablePath: chromePath || undefined, // Injecting Hostinger system chrome path if found
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const url = request.url();
            if (
                url.includes('chihuahuadoorstoppond.com') || 
                url.includes('doubleclick') || 
                url.includes('google-analytics') ||
                (url.includes('streamtape.com') === false && url !== 'about:blank')
            ) {
                request.abort();
            } else {
                request.continue();
            }
        });

        await page.goto(embedUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const playContainer = '.videocontainer, #olvideo, video';
        await page.waitForSelector(playContainer, { timeout: 10000 });
        await page.click(playContainer);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        await page.click(playContainer);

        let absoluteRealUrl = null;
        let attempts = 0;

        while (attempts < 20) {
            absoluteRealUrl = await page.evaluate(() => {
                const video = document.querySelector('video');
                return video && video.src && video.src.includes('stream') ? video.src : null;
            });

            if (absoluteRealUrl) break;
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        await browser.close();

        if (absoluteRealUrl) {
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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
