# Reddit Automation - Implementation Complete

## What Was Created

✅ **Puppeteer automation script** - Automatically logs into Reddit and posts to 5 target subreddits
✅ **Manual listing script** - For copy/paste posting if needed
✅ **Configuration** - Your credentials stored in .env (already configured)
✅ **Email reporting** - Can send daily reports to jpgreen1@gmail.com
✅ **Stats tracking** - Saves progress to stats.json
✅ **Dry-run mode** - Test without posting

## Files

```
/home/jpgreen1/.openclaw/workspace/reddit-automation/
├── index.js           (main automation script)
├── list-posts.js      (manual posting helper)
├── .env               (your Reddit credentials)
├── .env.example       (template)
├── package.json       (node dependencies)
├── stats.json         (auto-generated stats)
├── README.md          (detailed docs)
└── SETUP.md           (setup instructions)
```

## Immediate Next Steps

### 1. Build Karma (CRITICAL - Do this first!)
Before running automation, manually build Reddit karma:
- Go to r/Parenting, r/EvidenceBasedParents, r/ToxicFreeLiving, etc.
- Find 20-30 posts and leave genuine, helpful comments (no self-promotion)
- Upvote/downvote actively
- Goal: Get to at least 50-100 karma before automated posts

**Why?** Reddit's spam filter will immediately delete posts from low-karma accounts. This is the #1 reason for failure.

### 2. Test Login (after karma building)
Run a test to ensure login works:
```bash
npm start
```
The script will:
- Launch headless Chrome
- Log into Reddit
- Post to r/Parenting
- Wait 2 hours, then post to next subreddit, etc.
- Send you an email report

### 3. Set Up Email Reports (Optional but Recommended)
For Gmail:
1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`: `EMAIL_PASS=your_app_password`
4. Test: The script will send a report after posting

### 4. Adjust Posting Delay (if needed)
If your account is new (< 1 month), consider longer delays:
In `index.js`, change:
```javascript
CONFIG.delayBetweenPosts = 4 * 60 * 60 * 1000; // 4 hours instead of 2
```

## Security Notes

⚠️ **URGENT: Change your Reddit password** after we finish this campaign. It was shared in plain text.

🔐 **Enable 2FA** on Reddit and Gmail for future security.

📧 The app password for Gmail (if used) should be revoked after you're done with the campaign.

## Monitoring & Analytics

### Track Performance
- **Google Analytics**: Add UTM parameters to all links:
  `https://foodfactscanner.com?utm_source=reddit&utm_medium=social&utm_campaign=parenting`
  (Update the campaign name per subreddit if desired)

- **Reddit Stats**: Check post upvotes, comments, and engagement rate

- **Email Reports**: Will be sent automatically after posting (if email configured)

### Respond to Comments
The script checks your inbox every 30 minutes but does NOT auto-reply yet.
- Log into Reddit regularly (multiple times per day)
- Reply to every comment within 2-3 hours
- Be helpful, disclose affiliation, thank people

## Troubleshooting

**Posts get removed:**
- Stop automation immediately
- Build more karma manually (100+)
- Check subreddit rules for self-promotion percentage
- Consider posting manually instead

**Login fails with CAPTCHA:**
- Complete CAPTCHA manually quickly after script starts
- If persistent, Reddit may be blocking automation - use manual method

**Email not sending:**
- Verify EMAIL_PASS is an app password, not your regular password
- Check Gmail security settings
- Reports are also saved to .txt files as backup

## Alternative: Manual Posting

If automation fails or you risk a ban:
```bash
node list-posts.js
```
This prints all 5 posts ready to copy/paste into Reddit manually. Space them 2-3 days apart.

## For X.com (Twitter) Automation

I can also set up Twitter promotion using:
- The **social-media-agent** skill (already installed)
- Or a custom Puppeteer script

Let me know if you want me to configure that as well.

## Summary

You now have:
- ✅ Automated Reddit posting (5 posts, 2-hour delays)
- ✅ Email reports to jpgreen1@gmail.com
- ✅ Stats tracking
- ✅ Manual fallback option
- ✅ Google Analytics tracking ready

**BUT:**
- ⚠️ **Build karma first** (50-100 karma via manual commenting)
- ⚠️ **Change Reddit password** after campaign
- ⚠️ **Respond to all comments** promptly

**Ready to start?** Once you've built karma, run:
```bash
cd /home/jpgreen1/.openclaw/workspace/reddit-automation
npm start
```

Questions? Just ask.
