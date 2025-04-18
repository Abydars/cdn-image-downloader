const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/get-image-base64', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).send({ error: 'Missing imageUrl' });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setContent(`
      <html><body>
        <img id="img" src="${imageUrl}" crossorigin="anonymous" />
        <canvas id="canvas"></canvas>
      </body></html>
    `);

    await page.waitForSelector('#img');

    const base64 = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const img = document.getElementById('img');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          try {
            resolve(canvas.toDataURL('image/jpeg'));
          } catch (e) {
            reject('Canvas toDataURL failed');
          }
        };

        img.onerror = () => reject('Image failed to load');
      });
    });

    await browser.close();
    res.send({ base64 });
  } catch (err) {
    if (browser) await browser.close();
    res.status(500).send({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
