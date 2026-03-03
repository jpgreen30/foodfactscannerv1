require('dotenv').config();
const puppeteer = require('puppeteer');

// Use system Chromium to avoid missing library errors
const CHROME_PATH = '/usr/bin/chromium-browser';

// Parse command line args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

// Configuration
const CONFIG = {
  twitter: {
    username: process.env.TWITTER_USERNAME || 'foodfactscanner',
    password: process.env.TWITTER_PASSWORD,
    email: process.env.TWITTER_EMAIL || process.env.EMAIL_FROM || '' // Sometimes needed for 2FA
  },
  tweets: [
    {
      text: `Did you know 95% of baby foods contain heavy metals? I tested my baby's food and found lead in "organic" brands. 

I built @FoodFactScanner to help parents check toxins before buying.

Check it: foodfactscanner.com

#BabyFood #Parenting #ToxicFree #BabySafety`
    },
    {
      text: `Shocking: The 2021 Congressional report found arsenic, lead, cadmium & mercury in baby foods from major brands.

I created a free scanner that checks any product: foodfactscanner.com

No signup required. Please share with parents!

#BabyFoodSafety #HealthyBaby #EvidenceBased`
    },
    {
      text: `"Organic" baby food is NOT automatically safe from heavy metals. Toxins come from soil & processing, not pesticides.

Before you buy, check: foodfactscanner.com

Free tool for parents. Data from FDA, Consumer Reports.

#OrganicBaby #ToxinFree #MomLife`
    },
    {
      text: `Future parents: Don't put toxic baby food on your registry!

Scan any product before adding: foodfactscanner.com

Heavy metals in baby food are real. Protect your baby.

#ExpectingParents #BabyRegistry #HealthyBaby`
    },
    {
      text: `Parents: I was horrified to find lead in baby food pouches from "healthy" brands.

So I made @FoodFactScanner - a free tool to check heavy metal levels.

Search any brand: foodfactscanner.com

#MomTwitter #DadTwitter #BabyFood`
    }
  ],
  delayBetweenTweets: 3 * 60 * 60 * 1000, // 3 hours
  mentionMonitoringInterval: 60 * 60 * 1000, // 1 hour
  maxMentionsToCheck: 10,
  emailReports: {
    enabled: true,
    to: process.env.REPORT_EMAIL || 'jpgreen1@gmail.com',
    from: process.env.EMAIL_FROM || 'foodfactscanner@gmail.com'
  }
};

// Global state
let browser;
let page;
let stats = {
  tweetsCreated: 0,
  mentionsReplied: 0,
  errors: [],
  startTime: new Date()
};

const fs = require('fs');
const statsFile = '/home/jpgreen1/.openclaw/workspace/twitter-automation/stats.json';

// Load existing stats
if (fs.existsSync(statsFile)) {
  try {
    const saved = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    stats = { ...stats, ...saved };
  } catch (e) {
    console.log('Could not load existing stats, starting fresh');
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginToTwitter() {
  console.log('Navigating to Twitter login...');
  await page.goto('https://twitter.com/login', { waitUntil: 'networkidle2' });

  // Wait for login form
  await page.waitForSelector('input[name="text"]', { timeout: 30000 });

  console.log('Entering username...');
  await page.type('input[name="text"]', CONFIG.twitter.username, { delay: 100 });
  await page.keyboard.press('Enter');
  await delay(2000);

  // Check if there's a second step (username/email confirmation)
  const hasSecondStep = await page.$('input[name="text"]:not([type="hidden"])');
  if (hasSecondStep) {
    console.log('Second step: entering username/email...');
    await page.type('input[name="text"]', CONFIG.twitter.username, { delay: 100 });
    await page.keyboard.press('Enter');
    await delay(2000);
  }

  // Enter password
  await page.waitForSelector('input[name="password"]', { timeout: 30000 });
  console.log('Entering password...');
  await page.type('input[name="password"]', CONFIG.twitter.password, { delay: 100 });
  await page.keyboard.press('Enter');

  // Wait for login to complete
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {
    console.log('Navigation may have already occurred');
  });

  // Check for 2FA
  const has2FA = await page.$('input[data-testid="code"]') || await page.$('input[name="otp"]');
  if (has2FA) {
    console.log('2FA required! Please complete within 30 seconds...');
    if (DRY_RUN) {
      console.log('DRY RUN: Skipping 2FA');
      return;
    }
    await delay(30000);
  }

  // Check for CAPTCHA
  const hasCaptcha = await page.$('.captcha') || await page.$('iframe[src*="captcha"]');
  if (hasCaptcha) {
    console.log('CAPTCHA detected! Please complete manually...');
    if (DRY_RUN) {
      console.log('DRY RUN: Skipping CAPTCHA');
      return;
    }
    await delay(60000);
  }

  // Verify login success
  const url = page.url();
  if (url.includes('login') || url.includes('/suspend')) {
    throw new Error('Login failed - check credentials or account may be locked');
  }

  console.log('Login successful!');
}

async function createTweet(tweet, dryRun = DRY_RUN) {
  console.log(`[${new Date().toISOString()}] Tweeting: ${tweet.text.substring(0, 50)}...`);

  if (dryRun) {
    console.log('DRY RUN - Would tweet:');
    console.log(tweet.text);
    console.log('---');
    return { success: true, dryRun: true };
  }

  try {
    // Navigate to home/compose
    await page.goto('https://twitter.com/home', { waitUntil: 'networkidle2' });

    // Wait for and click tweet button
    await page.waitForSelector('[data-testid="tweetButtonInline"]', { timeout: 10000 }).catch(() => {
      // Alternative selector
      return page.waitForSelector('[data-testid="sidebarColumn"] button[role="switch"]', { timeout: 10000 });
    });

    // Click "What's happening?" area to open compose
    await page.click('[data-testid="tweetButtonInline"]') || await page.click('div[role="textbox"]');

    // Wait for textarea
    await page.waitForSelector('div[role="textbox"]', { timeout: 10000 });

    // Type tweet
    await page.click('div[role="textbox"]');
    await page.type('div[role="textbox"]', tweet.text, { delay: 50 });

    // Add tweet (wait for button to be enabled)
    await page.waitForSelector('[data-testid="tweetButton"]:not([disabled])', { timeout: 10000 });
    await page.click('[data-testid="tweetButton"]');

    // Wait for tweet to post
    await delay(3000);

    console.log('✓ Tweet posted successfully');
    stats.tweetsCreated++;
    await saveStats();

    return { success: true };
  } catch (error) {
    console.error('✗ Failed to tweet:', error.message);
    stats.errors.push({
      action: 'tweet',
      error: error.message,
      time: new Date().toISOString()
    });
    await saveStats();
    return { success: false, error: error.message };
  }
}

async function checkMentions() {
  console.log(`[${new Date().toISOString()}] Checking mentions...`);

  try {
    await page.goto('https://twitter.com/notifications', { waitUntil: 'domcontentloaded' });

    // Wait for notifications
    await page.waitForSelector('[data-testid="Cell"]', { timeout: 10000 }).catch(() => {
      console.log('No notifications found');
      return;
    });

    const mentionElements = await page.$$('[data-testid="Cell"]');
    console.log(`Found ${mentionElements.length} notifications`);

    // For each mention, could reply automatically (but manual reply recommended)
    // For now just log them
    for (let i = 0; i < Math.min(mentionElements.length, CONFIG.maxMentionsToCheck); i++) {
      try {
        const text = await page.evaluate((el) => {
          return el.innerText.substring(0, 200);
        }, mentionElements[i]);
        console.log(`- Mention ${i + 1}: ${text}...`);
      } catch (e) {
        // ignore
      }
    }

    stats.mentionsReplied = mentionElements.length;
  } catch (error) {
    console.log('Error checking mentions:', error.message);
  }
}

async function sendEmailReport() {
  if (!CONFIG.emailReports.enabled || !process.env.EMAIL_PASS) {
    console.log('Email reports disabled (set EMAIL_PASS in .env to enable)');
    return;
  }

  const nodemailer = require('nodemailer');
  const report = `
FoodFactScanner Twitter Automation Report
Generated: ${new Date().toISOString()}

=== SUMMARY ===
Tweets Created: ${stats.tweetsCreated}
Mentions Checked: ${stats.mentionsReplied}
Errors: ${stats.errors.length}
Uptime: ${Math.floor((new Date() - stats.startTime) / 1000 / 60)} minutes

=== ERRORS ===
${stats.errors.map(e => `[${e.time}] ${e.action || 'unknown'}: ${e.error}`).join('\n') || 'None'}

=== NEXT STEPS ===
- Check Twitter for mentions and replies
- Reply to all interactions promptly
- Monitor for any account issues (suspension warnings)
`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: CONFIG.emailReports.from,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: CONFIG.emailReports.from,
      to: CONFIG.emailReports.to,
      subject: `Twitter Report - FoodFactScanner - ${new Date().toLocaleDateString()}`,
      text: report
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Email report sent to ${CONFIG.emailReports.to}`);
  } catch (err) {
    console.error('✗ Failed to send email:', err.message);
    // Save to file
    fs.writeFileSync(`/home/jpgreen1/.openclaw/workspace/twitter-automation/report-${Date.now()}.txt`, report);
    console.log('Report saved to file instead.');
  }
}

async function saveStats() {
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
}

async function main() {
  console.log('='.repeat(60));
  console.log('FoodFactScanner Twitter Automation');
  console.log('Mode:', DRY_RUN ? 'DRY RUN (no actual tweets)' : 'LIVE');
  console.log('='.repeat(60));

  if (DRY_RUN) {
    console.log('\n=== DRY RUN MODE ===');
    console.log('These tweets would be posted:\n');
    CONFIG.tweets.forEach((t, i) => {
      console.log(`${i + 1}. ${t.text}\n`);
    });
    return;
  }

  console.log('Launching browser...');
  const launchOptions = {
    headless: true,
    executablePath: CHROME_PATH,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer',
      '--disable-gpu'
    ]
  };
  console.log(`Using Chromium at: ${CHROME_PATH}`);
  browser = await puppeteer.launch(launchOptions);
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    await loginToTwitter();

    // Post tweets with delays
    for (const tweet of CONFIG.tweets) {
      const result = await createTweet(tweet);
      console.log(`Tweet ${result.success ? 'succeeded' : 'failed'}`);

      if (result.success && !result.dryRun) {
        console.log(`Waiting ${CONFIG.delayBetweenTweets / 1000 / 60} minutes before next tweet...`);
        await delay(CONFIG.delayBetweenTweets);
      }
    }

    console.log('\n=== Initial tweeting complete ===');
    console.log('Stats:', stats);
    await saveStats();
    await sendEmailReport();

    // Monitoring loop
    console.log('\n=== Starting monitoring loop ===');
    console.log(`Check mentions every ${CONFIG.mentionMonitoringInterval / 1000 / 60} minutes`);
    console.log('Press Ctrl+C to exit and send final report.\n');

    while (true) {
      await delay(CONFIG.mentionMonitoringInterval);
      await checkMentions();
      await saveStats();
    }

  } catch (error) {
    console.error('\nFatal error:', error);
    stats.errors.push({ time: new Date().toISOString(), error: error.message });
    await saveStats();
    await sendEmailReport();
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await saveStats();
  await sendEmailReport();
  if (browser) await browser.close();
  console.log('Done.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down...');
  await saveStats();
  await sendEmailReport();
  if (browser) await browser.close();
  process.exit(0);
});

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
