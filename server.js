const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
app.use(express.json());

app.post('/get-image-base64', async (req, res) => {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).send({ error: 'Missing imageUrl' });

try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
'--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-web-security',
  '--disable-features=IsolateOrigins,site-per-process'
],
    });

    const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36');
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://your-bubble-app.com', // match where the image works
  });

    await page.setContent(`
      <html>
        <body>
          <img id="img" src="${imageUrl}" crossorigin="anonymous" />
          <canvas id="canvas"></canvas>
          <script>
            // Trigger window.onload when image finishes loading or fails
            const img = document.getElementById('img');
            img.onload = img.onerror = () => window.status = 'ready';
          </script>
        </body>
      </html>
    `);

    // Wait for window.status to be set
    await page.waitForFunction(() => window.status === 'ready', { timeout: 10000 });

    const base64 = await page.evaluate(() => {
      try {
        const img = document.getElementById('img');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        return canvas.toDataURL('image/jpeg');
      } catch (e) {
        return 'ERROR: ' + e.message;
      }
    });

    if (base64.startsWith('ERROR')) throw new Error(base64);

        await browser.close();
        res.send({ base64 });
    } catch (err) {
        if (browser) await browser.close();
        res.status(500).send({ error: err.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
