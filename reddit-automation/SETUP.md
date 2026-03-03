# Reddit Automation Setup Guide

## Quick Start

1. **Configure .env file**
   The .env file already contains your Reddit credentials (foodfactscanner / Rocks0522!@#).

2. **Set up Gmail for email reports** (optional but recommended):
   - Go to https://support.google.com/accounts/answer/185833
   - Enable 2-Factor Authentication
   - Generate an App Password
   - Add to .env: `EMAIL_PASS=your_app_password`

3. **Test with dry-run:**
   ```bash
   npm run dry-run
   ```

4. **Run automation:**
   ```bash
   npm start
   ```

## How It Works

1. Logs into Reddit using Puppeteer
2. Posts to 5 subreddits with 2-hour delay between each
3. Monitors inbox for comments every 30 minutes
4. Sends email reports (if email configured)
5. Stats are saved to `stats.json`

## Important: Reddit Rules

To avoid being banned:

1. **Build karma first** (50+):
   - Before posting, spend time commenting genuinely in target subs
   - Use the `--dry-run` mode to see where to engage

2. **Disclose affiliation**:
   - Each post already includes "(Disclosure: I built this tool)"
   - This is required by Reddit

3. **Space posts appropriately**:
   - Default: 2 hours between posts (configurable)
   - Don't post to same subreddit more than once per day
   - Don't post if your account has < 100 karma

4. **Engage with comments**:
   - Respond to every comment within a few hours
   - Be helpful, not defensive
   - If a moderator asks questions, cooperate

5. **Account age**:
   - Reddit may flag new accounts (< 30 days)
   - Consider using an older account if possible

## Subreddit-Specific Rules

Check each subreddit's rules before posting:

- **r/Parenting**: Generally allows self-promotion if disclosed and not excessive
- **r/EvidenceBasedParents**: Prefers data-driven posts, may require mod approval
- **r/ToxicFreeLiving**: Likely OK with tool promotion if relevant
- **r/ExclusivelyBreastfed**: Can be strict about self-promotion
- **r/ExpectedParents**: Usually welcoming to tools for parents

## Configuration Options

Edit `index.js`:

```javascript
CONFIG.delayBetweenPosts = 2 * 60 * 60 * 1000; // Change to 4 hours = 4*60*60*1000
CONFIG.postMonitoringInterval = 30 * 60 * 1000; // Check comments every 30 min
```

Add/remove subreddits and posts in the `posts` array.

## Troubleshooting

**Login fails with CAPTCHA:**
- Complete the CAPTCHA manually within 30 seconds of the script starting
- If that's not possible, you may need to use a different account or solve CAPTCHAs manually each run

**Posts get removed:**
- Check your subreddit rules
- Increase delay between posts
- Build more karma first (manual commenting)
- Consider manual posting instead

**Email not sending:**
- Verify EMAIL_PASS is an App Password (not your regular Gmail password)
- Check Gmail security settings: https://myaccount.google.com/security-checkup
- Look for "Less secure app access" - should be OFF, App Passwords should be ON

**Browser crashes:**
- The script runs headless Chrome with --no-sandbox
- If issues persist, try setting `headless: false` in the puppeteer.launch options for debugging

## stats.json

This file tracks:
- postsCreated
- commentsReplied (placeholder)
- errors (array with timestamps)
- startTime

Don't edit manually - it's updated automatically.

## Security

- The .env file contains your Reddit password and email credentials
- Never commit .env to git (it's in .gitignore)
- After automation is complete, consider:
  - Changing Reddit password
  - Revoking the Gmail App Password if no longer needed
  - Removing FoodFactScanner.com from your account's authorized apps

## Need Help?

Check logs in console output. Errors are also saved to stats.json.

For issues specific to puppeteer/Chrome, see: https://pptr.dev/
