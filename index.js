import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  const { username, password, code, lang, slug } = req.body;

  if (!username || !password || !code || !slug) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://leetcode.com/accounts/login/');

    await page.type('#id_login', username);
    await page.type('#id_password', password);
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    await page.goto(`https://leetcode.com/problems/${slug}/`);

    await page.waitForSelector('.monaco-editor');

    await page.evaluate((codeText) => {
      const editor = document.querySelector('.monaco-editor');
      const textarea = editor.querySelector('textarea');
      textarea.value = codeText;
      textarea.dispatchEvent(new Event('input'));
    }, code);

    await page.click('button:has-text("Submit")');

    await page.waitForSelector('.status-column'); // or adjust accordingly

    await browser.close();

    return res.json({ success: true, message: 'Submitted successfully!' });
  } catch (err) {
    await browser.close();
    return res.status(500).json({ error: err.message });
  }
}
