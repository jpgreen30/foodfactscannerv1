# Reddit Automation for FoodFactScanner

Automated Reddit posting and monitoring using Puppeteer.

## Setup

1. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Reddit credentials and email settings
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the automation:**
   ```bash
   node index.js
   ```

## How It Works

1. **Login** to Reddit with your credentials
2. **Post** to configured subreddits with delay between posts (default 2 hours)
3. **Monitor** posts for comments (basic implementation)
4. **Email reports** to your configured email address

## Configuration

Edit `index.js` to customize:
- `subreddits`: List of target subreddits
- `posts`: Array of post objects (subreddit, title, content)
- `delayBetweenPosts`: Time between posts in milliseconds (default 2 hours)
- `postMonitoringInterval`: How often to check for comments (default 30 minutes)

## Security Notes

- Never commit `.env` file to version control
- Use an App Password for Gmail (2FA enabled)
- Reddit may flag automated posting as spam. Follow these rules:
  - Build karma first (comment in subreddits before posting)
  - Space posts at least 2-3 hours apart
  - Disclose affiliation in each post
  - Engage with all comments promptly

## Email Setup (Gmail)

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: https://support.google.com/accounts/answer/185833
3. Use that password as `EMAIL_PASS` in .env

## Troubleshooting

- **Login fails**: Check credentials, Reddit may require CAPTCHA/2FA
- **Posts get removed**: Subreddit rules may prohibit self-promotion. Adjust frequency/content.
- **No email reports**: Check .env email settings, SMTP configuration

## Files

- `index.js` - Main automation script
- `.env` - Your secrets (not in git)
- `stats.json` - Automatically updated with posting stats
- `report-*.txt` - Email report backups

## Manual Alternative

If automation fails, you can copy/paste the post content from `index.js` and publish manually from your browser.
