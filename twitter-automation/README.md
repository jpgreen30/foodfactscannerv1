# Twitter/X Automation for FoodFactScanner

Automated Twitter posting and mention monitoring using Puppeteer.

## Setup

1. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Twitter credentials and email settings
   ```

   The `.env` file already contains:
   - TWITTER_USERNAME=foodfactscanner
   - TWITTER_PASSWORD=Rocks0522!@#
   - TWITTER_EMAIL=foodfactscanner@gmail.com

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Test dry-run:**
   ```bash
   npm run dry-run
   ```

4. **Run automation:**
   ```bash
   npm start
   ```

## How It Works

1. Logs into Twitter/X using Puppeteer
2. Posts 5 tweets with 3-hour delays between each
3. Monitors notifications/mentions every hour
4. Sends email reports (if email configured)
5. Stats saved to `stats.json`

## Configuration

Edit `index.js`:

```javascript
CONFIG.delayBetweenTweets = 3 * 60 * 60 * 1000; // Change delay (default 3 hours)
CONFIG.mentionMonitoringInterval = 60 * 60 * 1000; // Check mentions every hour
```

Customize `tweets` array with your own content. Use hashtags relevant to parenting, baby food safety, toxin-free living.

## Security Notes

- Never commit `.env` file
- Use an App Password for Gmail (2FA enabled)
- Twitter may suspend accounts for aggressive automation. Be conservative.

## Important: Twitter Rules

Twitter's automation policy requires:

1. **Disclose automated behavior** in your bio if using automation. Consider: "Posts may be automated. I'm the founder of FoodFactScanner.com"
2. **Don't spam** - limit to 5-10 tweets per day max
3. ** Engage with replies** - respond within a few hours
4. **Rate limits** - 3-hour delays are safe for new accounts
5. **Account age** - Accounts < 30 days may get flagged. Use an older account if possible.

## Email Setup (Gmail)

1. Enable 2FA on Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Set `EMAIL_PASS` in .env

## Troubleshooting

**Login fails with CAPTCHA:**
- Twitter often requires CAPTCHA on first login. Complete manually within 30 seconds.
- If persistent, you may need to solve CAPTCHAs each run or use a more established account.

**Account locked/suspended:**
- Stop automation immediately
- Reduce tweet frequency (increase delay)
- Verify email/phone on Twitter account
- Consider manual posting only

**Email not sending:**
- Verify EMAIL_PASS is an App Password
- Check Gmail security settings

## Files

- `index.js` - Main automation script
- `.env` - Your secrets (not in git)
- `stats.json` - Auto-generated stats
- `list-tweets.js` - Manual tweet drafts
- `README.md` - This file

## Manual Alternative

```bash
node list-tweets.js
```

Prints all 5 tweets ready to copy/paste manually. Space tweets 3-4 hours apart. Respond to all mentions within 1-2 hours.

## Analytics

Use UTM: `foodfactscanner.com?utm_source=twitter&utm_medium=social`

Track in Google Analytics.

## Security

After campaign:
- Change Twitter password
- Revoke Gmail App Password if no longer needed
- Remove any third-party app access from Twitter settings

## Next Steps

1. Build Twitter profile: Add bio, profile picture, banner
2. Post some organic tweets first (10-15 non-promotional)
3. Follow relevant accounts (parents, parenting influencers)
4. Engage with baby food safety conversations for a few days
5. Then start automated posting
