require('dotenv').config();
const puppeteer = require('puppeteer');

// Use system Chromium to avoid missing library errors
const CHROME_PATH = '/usr/bin/chromium-browser';

// Parse command line args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

// Configuration from environment variables
const CONFIG = {
  reddit: {
    username: process.env.REDDIT_USERNAME || 'foodfactscanner',
    password: process.env.REDDIT_PASSWORD,
  },
  subreddits: [
    'Parenting',
    'EvidenceBasedParents',
    'ToxicFreeLiving',
    'ExclusivelyBreastfed',
    'ExpectedParents',
    'Mommit',
    'NewParents'
  ],
  posts: [
    {
      subreddit: 'Parenting',
      title: 'I tested my baby food and found heavy metals in organic brands - here\'s what I learned',
      content: `I'm a parent who was shocked to learn that 95% of baby foods contain heavy metals. After testing my own baby's food with a scanner, I found lead in organic products labeled "all natural." 

Here's what I learned about reading labels and what to actually look for (hint: "organic" doesn't mean safe).

I built FoodFactScanner.com to help parents quickly scan products and see toxin levels before buying. 

Has anyone else tested their baby food? What were your findings?

(Disclosure: I built this tool to help parents make informed choices)`
    },
    {
      subreddit: 'EvidenceBasedParents',
      title: 'Compiled data: Heavy metals in baby food are widespread - created a free scanner',
      content: `Research shows arsenic, lead, cadmium, and mercury are commonly found in baby food, even from trusted brands. The FDA has proposed limits but enforcement is years away.

I compiled publicly available test data from Consumer Reports, FDA's Total Diet Study, and independent labs, and created a free scanner at FoodFactScanner.com that checks products against these databases.

Would a tool like this be useful to you? Are there specific brands you'd like to see tested?

(Disclosure: I'm the creator of FoodFactScanner)`
    },
    {
      subreddit: 'ToxicFreeLiving',
      title: 'Free tool to check baby food for heavy metals before you buy',
      content: `Tired of wondering if your baby's food is truly safe? I was too. So I built a tool that scans baby food products and instantly shows heavy metal levels.

FoodFactScanner.com aggregates data from FDA, Consumer Reports, and independent labs. Just search any brand/product and see if it's safe.

It's free, no signup required. Hope it helps other parents avoid toxic exposure during this critical development stage.

(Disclosure: My project)`
    },
    {
      subreddit: 'ExclusivelyBreastfed',
      title: 'Moms - have you checked what\'s in those baby food pouches?',
      content: `Hey moms, especially those doing BLW or using packaged foods - have you checked what's actually in those baby food pouches? I was horrified to find lead in products from major "healthy" brands.

I made FoodFactScanner.com specifically for parents to quickly check before buying. You can search by brand or product name and see toxin levels from lab tests.

Sharing because I wish someone had told me earlier. Stay safe!

(Disclosure: I built this tool)`
    },
    {
      subreddit: 'ExpectedParents',
      title: 'Future parents: Check baby food for toxins before adding to registry',
      content: `Future parents: Start your baby registry with safety in mind. I just discovered that many popular baby food brands contain heavy metals, and the "organic" label doesn't guarantee safety.

I built FoodFactScanner.com to help parents make informed choices. Before adding any food to your registry, scan it to check for toxins.

Here's to healthy babies! 💚

(Disclosure: My project to help parents)`
    }
  ],
  delayBetweenPosts: 2 * 60 * 60 * 1000, // 2 hours
  postMonitoringInterval: 30 * 60 * 1000, // 30 minutes
  maxCommentsToCheck: 20,
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
  postsCreated: 0,
  commentsReplied: 0,
  errors: [],
  startTime: new Date()
};

// Load existing stats if available
const fs = require('fs');
const statsFile = '/home/jpgreen1/.openclaw/workspace/reddit-automation/stats.json';
if (fs.existsSync(statsFile)) {
  try {
    const saved = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    stats = { ...stats, ...saved };
  } catch (e) {
    // Use default stats
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginToReddit() {
  console.log('Navigating to Reddit login...');
  await page.goto('https://www.reddit.com/login', { waitUntil: 'networkidle2' });

  // Wait for the login form
  await page.waitForSelector('input[name="username"]', { timeout: 30000 });

  console.log('Entering credentials for:', CONFIG.reddit.username);
  await page.type('input[name="username"]', CONFIG.reddit.username, { delay: 100 });
  await page.type('input[name="password"]', CONFIG.reddit.password, { delay: 100 });

  // Click login button
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {
    // Sometimes Reddit doesn't fully navigate on login
  });

  // Check for 2FA or CAPTCHA
  const has2FA = await page.$('input[name="otp"]');
  if (has2FA) {
    console.log('2FA required! Please complete authentication manually within 30 seconds...');
    // In dry-run, just fail
    if (DRY_RUN) {
      console.log('DRY RUN: Skipping 2FA requirement');
      return;
    }
    // Wait for manual 2FA
    await delay(30000);
  }

  // Check for CAPTCHA
  const hasCaptcha = await page.$('.RecaptchaChat');
  if (hasCaptcha) {
    console.log('CAPTCHA detected! Please complete it manually...');
    if (DRY_RUN) {
      console.log('DRY RUN: Skipping CAPTCHA');
      return;
    }
    await delay(60000); // Wait a minute for manual solve
  }

  // Verify login success
  const url = page.url();
  if (url.includes('login') || url.includes('/error')) {
    throw new Error('Login failed - check credentials or CAPTCHA/2FA required');
  }
  console.log('Login successful!');
}

async function createPost(post, dryRun = DRY_RUN) {
  console.log(`[${new Date().toISOString()}] Posting to r/${post.subreddit}: ${post.title}`);

  if (dryRun) {
    console.log(`DRY RUN - Would post to r/${post.subreddit}`);
    console.log(`Title: ${post.title}`);
    console.log(`Content preview: ${post.content.substring(0, 200)}...`);
    console.log('---');
    return { success: true, dryRun: true, subreddit: post.subreddit };
  }

  try {
    // Navigate to subreddit submit page
    await page.goto(`https://www.reddit.com/r/${post.subreddit}/submit`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for form
    await page.waitForSelector('textarea[title="Text"]', { timeout: 30000 });
    await page.waitForSelector('textarea[title="Title"]', { timeout: 30000 });

    // Fill title
    await page.type('textarea[title="Title"]', post.title, { delay: 50 });

    // Fill content
    await page.type('textarea[title="Text"]', post.content, { delay: 50 });

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Wait a bit and get post URL
    await delay(2000);
    const postUrl = page.url();

    console.log(`✓ Post created: ${postUrl}`);
    stats.postsCreated++;
    await saveStats();

    return { success: true, url: postUrl, subreddit: post.subreddit };
  } catch (error) {
    console.error(`✗ Failed to post to r/${post.subreddit}:`, error.message);
    stats.errors.push({
      subreddit: post.subreddit,
      error: error.message,
      time: new Date().toISOString()
    });
    await saveStats();
    return { success: false, error: error.message, subreddit: post.subreddit };
  }
}

async function checkComments() {
  console.log(`[${new Date().toISOString()}] Checking comments on posts...`);

  // For now, just check notifications page for mentions/replies
  try {
    await page.goto('https://www.reddit.com/message/inbox', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="comment-item"]', { timeout: 10000 }).catch(() => {
      console.log('No new comments/replies');
      return;
    });

    const commentElements = await page.$$('[data-testid="comment-item"]');
    console.log(`Found ${commentElements.length} new notifications`);

    // Mark as read (optional)
    for (const el of commentElements.slice(0, CONFIG.maxCommentsToCheck)) {
      try {
        const text = await page.evaluateHandle((e) => {
          const container = e.closest('[data-testid="comment-item"]');
          return container ? container.innerText : '';
        }, el);
        console.log(`- ${await text.jsonValue()}`);
      } catch (e) {
        // Ignore
      }
    }
  } catch (error) {
    console.log('Note:', error.message);
  }

  stats.commentsReplied = stats.commentsReplied; // Placeholder
}

async function sendEmailReport() {
  if (!CONFIG.emailReports.enabled || !process.env.EMAIL_PASS) {
    console.log('Email reports disabled (set EMAIL_PASS in .env to enable)');
    return;
  }

  const nodemailer = require('nodemailer');
  const report = `
FoodFactScanner Reddit Automation Report
Generated: ${new Date().toISOString()}

=== SUMMARY ===
Posts Created: ${stats.postsCreated}
Comments Checked: ${stats.commentsReplied}
Errors: ${stats.errors.length}
Uptime: ${Math.floor((new Date() - stats.startTime) / 1000 / 60)} minutes

=== ERRORS ===
${stats.errors.map(e => `[${e.time}] ${e.subreddit}: ${e.error}`).join('\n') || 'None'}

=== NEXT STEPS ===
- Check Reddit for engagement on posts
- Reply to comments promptly
- Monitor for any moderator messages
`;

  try {
    // Create transporter (Gmail example)
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
      subject: `Reddit Report - FoodFactScanner - ${new Date().toLocaleDateString()}`,
      text: report
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Email report sent to ${CONFIG.emailReports.to}`);
  } catch (err) {
    console.error('✗ Failed to send email:', err.message);
    // Save report to file as backup
    fs.writeFileSync(`/home/jpgreen1/.openclaw/workspace/reddit-automation/report-${Date.now()}.txt`, report);
    console.log('Report saved to file instead.');
  }
}

async function saveStats() {
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
}

async function main() {
  console.log('='.repeat(60));
  console.log('FoodFactScanner Reddit Automation');
  console.log('Mode:', DRY_RUN ? 'DRY RUN (no actual posts)' : 'LIVE');
  console.log('='.repeat(60));

  if (DRY_RUN) {
    console.log('\n=== DRY RUN MODE ===');
    console.log('These posts would be created (in order):\n');
    CONFIG.posts.forEach((p, i) => {
      console.log(`${i + 1}. r/${p.subreddit}`);
      console.log(`   Title: ${p.title}`);
      console.log(`   Content: ${p.content.substring(0, 100)}...\n`);
    });
    console.log('No actual browser launch or posting will occur.');
    return;
  }

  // Launch browser
  console.log('Launching browser...');
  const launchOptions = {
    headless: false,
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
    // Login
    await loginToReddit();

    // Create posts with delays
    for (const post of CONFIG.posts) {
      const result = await createPost(post);

      if (result.success && !result.dryRun) {
        console.log(`Waiting ${CONFIG.delayBetweenPosts / 1000 / 60} minutes before next post...`);
        await delay(CONFIG.delayBetweenPosts);
      }
    }

    console.log('\n=== Initial posting complete ===');
    console.log('Stats:', stats);
    await saveStats();

    // Send email report
    await sendEmailReport();

    // Enter monitoring loop
    console.log('\n=== Starting monitoring loop ===');
    console.log(`Will check for comments every ${CONFIG.postMonitoringInterval / 1000 / 60} minutes`);
    console.log('Press Ctrl+C to exit and send final report.\n');

    while (true) {
      await delay(CONFIG.postMonitoringInterval);
      await checkComments();
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

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down gracefully...');
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

// Run
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
