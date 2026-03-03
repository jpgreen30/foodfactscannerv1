# FoodFactScanner - Full Social Media Automation

## Overview

Two automated social media campaigns to promote FoodFactScanner.com to new and expecting mothers concerned about baby food safety, heavy metals, and toxins.

**Platforms:**
- **Reddit** - 5 posts across parenting subreddits
- **Twitter/X** - 5 tweets with hashtag campaigns

---

## 📁 **Project Structure**

```
/home/jpgreen1/.openclaw/workspace/
├── reddit-automation/
│   ├── index.js          (automated posting)
│   ├── list-posts.js     (manual copy/paste)
│   ├── .env              (credentials)
│   ├── package.json
│   ├── stats.json
│   ├── README.md
│   ├── SETUP.md
│   └── SUMMARY.md
│
├── twitter-automation/
│   ├── index.js          (automated tweeting)
│   ├── list-tweets.js    (manual copy/paste)
│   ├── .env              (credentials)
│   ├── package.json
│   ├── stats.json
│   ├── README.md
│   ├── SETUP.md
│   └── SUMMARY.md
```

---

## 🚀 **Quick Start**

### **Reddit Campaign**

1. **Build karma** - Manually comment 20-30 times in target subs (see subreddits below)
2. **Test dry-run:**
   ```bash
   cd reddit-automation
   npm run dry-run
   ```
3. **Configure email** (optional): Add Gmail App Password to `.env`
4. **Launch:**
   ```bash
   npm start
   ```

### **Twitter Campaign**

1. **Warm up account:**
   - Complete profile (photo, bio, link)
   - Follow 20-30 parenting/baby food accounts
   - Post organically for 2-3 days
2. **Test dry-run:**
   ```bash
   cd twitter-automation
   npm run dry-run
   ```
3. **Configure email** (optional): Add Gmail App Password to `.env`
4. **Launch:**
   ```bash
   npm start
   ```

---

## 🎯 **Target Audience**

**Primary:** New and expecting mothers, 25-40 years old
- Concerned about baby food safety
- Researching baby nutrition
- Active on parenting forums and Twitter parenting communities
- Willing to try tools that protect their children

**Secondary:** Health-conscious parents, nutritionists, parenting bloggers

---

## 📊 **Platform Strategy**

### **Reddit**

**Subreddits:**
- r/Parenting (2.5M members)
- r/EvidenceBasedParents (150k)
- r/ToxicFreeLiving (200k)
- r/ExclusivelyBreastfed (150k)
- r/ExpectedParents (200k)
- r/Mommit (1M)
- r/NewParents (200k)

**Tone:** Informative, personal story, data-driven, solution-oriented

**Posts:**
1. Personal testing story (Parenting)
2. Data compilation + scanner (EvidenceBasedParents)
3. Free tool announcement (ToxicFreeLiving)
4. Community-specific (ExclusivelyBreastfed)
5. Proactive for future parents (ExpectedParents)

**Delays:** 2 hours between posts (avoid spam detection)

**Disclosure:** Each post includes "(Disclosure: I built this tool to help parents...)"

---

### **Twitter/X**

**Handle:** @foodfactscanner

**Tweets:**
1. Heavy metals stat + personal story
2. Congressional report + free scanner
3. Organic ≠ safe myth busting
4. Baby registry warning
5. Personal horror + call-to-action

**Hashtags:**
#BabyFood #Parenting #ToxicFree #BabySafety #BabyFoodSafety #HealthyBaby #EvidenceBased #OrganicBaby #ToxinFree #MomLife #ExpectingParents #BabyRegistry #MomTwitter #DadTwitter

**Delays:** 3 hours between tweets

**Profile:** Complete bio, profile picture, website link

---

## 📈 **Analytics & Tracking**

### **UTM Parameters**

**Reddit:**
```
https://foodfactscanner.com?utm_source=reddit&utm_medium=social&utm_campaign=parenting
```
Vary `utm_campaign` per subreddit:
- parenting
- evidence
- toxinfree
- breastfeeding
- expecting

**Twitter:**
```
https://foodfactscanner.com?utm_source=twitter&utm_medium=social&utm_campaign=tweet1
```
Vary `utm_campaign` per tweet: tweet1, tweet2, tweet3, tweet4, tweet5

### **Google Analytics Setup**

1. Create a **Custom Report**:
   - Dimensions: Source/Medium, Campaign
   - Metrics: Sessions, Pageviews, Bounce Rate, Avg. Session Duration
   - Filter: Campaign contains "reddit" or "twitter"

2. **Set up Goals** (if not already):
   - Goal: "Scanner Usage" - Destination contains `/scan` or `/check`
   - Goal: "Newsletter Signup" if you have one

3. **Real-time monitoring**:
   - Check Real-time → Sources when posts go live
   - Expect 5-20 concurrent users from each post/tweet initially

---

## 📧 **Email Reports**

Automated reports sent to jpgreen1@gmail.com after:
- All Reddit posts complete
- All tweets complete
- Upon manual shutdown (Ctrl+C)

Report includes:
- Posts/tweets created count
- Mentions/comments found
- Any errors
- Uptime duration

**To enable Gmail:**
1. Enable 2FA on Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add `EMAIL_PASS=your_app_password` to both `.env` files

---

## ⚠️ **Critical Success Factors**

### **1. Build Organic Presence FIRST**

Reddit & Twitter will ban/suspend new accounts that immediately self-promote.

**Reddit:** Build 50-100 karma via genuine commenting (no links) for 2-3 days before posting.

**Twitter:** Post 10-15 non-promotional tweets, follow/like/retweet for 2-3 days before promotional tweets.

### **2. Engagement is NOT Optional**

- **Reddit:** Respond to EVERY comment within 2 hours
- **Twitter:** Reply to EVERY mention/retweet/comment within 1 hour
- Be grateful, helpful, not defensive
- If criticized, thank for feedback and ask clarifying questions

Failure to engage = downvotes, negative replies, possible ban.

### **3. Disclose Affiliation**

Our posts already include disclosure. Do NOT remove it.
Transparency builds trust and is required by both platforms' policies.

### **4. Rate Limiting**

- **Reddit:** 2+ hours between posts (script enforces this)
- **Twitter:** 3+ hours between tweets (script enforces this)
- Do NOT speed up delays or post more than planned

### **5. Monitor Account Health**

- Check Reddit messages for mod warnings
- Check Twitter notifications for suspension warnings
- Stop automation immediately if you receive warnings
- Respond to mod inquiries politely

---

## 🛡️ **Security Checklist**

- [ ] Change Reddit password after campaign completes
- [ ] Enable 2FA on Reddit
- [ ] Change Twitter password after campaign completes
- [ ] Enable 2FA on Twitter
- [ ] Revoke Gmail App Passwords after email reports are done (if not needed ongoing)
- [ ] Delete `.env` files if storing on shared/backup systems
- [ ] Rotate passwords monthly going forward

---

## 📅 **Recommended Campaign Schedule**

### **Week 1: Preparation**
- Day 1-2: Warm up Twitter (follow, post organic content)
- Day 2-3: Build Reddit karma (comment without linking)
- Day 4: Test dry-run modes, verify credentials
- Day 5: Configure email, finalize setup

### **Week 2: Launch**
- Day 6: Run Reddit automation (5 posts over ~10 hours)
- Day 6-7: Monitor comments, respond promptly
- Day 7: Run Twitter automation (5 tweets over ~12 hours)
- Day 7-8: Monitor mentions, engage

### **Week 3: Sustain**
- Continue responding to any new comments/mentions
- Post 1-2 organic tweets per week on Twitter
- Comment in Reddit threads to stay visible
- Check GA for traffic patterns

### **Week 4: Evaluate**
- Review stats.json for total posts/tweets
- Check GA for traffic from social
- Calculate conversions (scanner usage, email signups)
- Decide whether to repeat, adjust, or stop

---

## 🔄 **Ongoing Maintenance**

- **Daily** (5-10 min): Check Reddit/Twitter notifications, reply
- **Every few days**: Post organic content (non-promotional) to keep account active
- **Weekly**: Review GA stats, see which subreddits/tweets perform best
- **Monthly**: Change passwords, rotate credentials

---

## 📞 **Support & Troubleshooting**

### **Reddit posts removed:**
- STOP immediately
- Build more karma (100+)
- Check subreddit rules for self-promo ratio (usually 1:10)
- Consider manual posting instead of automation

### **Twitter account locked:**
- Complete any required challenges
- Verify email/phone
- Stop automation, reduce frequency
- Wait 24-48 hours before tweeting again

### **Email not sending:**
- Verify EMAIL_PASS is an App Password (not regular password)
- Check Gmail security: https://myaccount.google.com/security
- Look for "Sign-in attempt blocked" - may need to allow "less secure apps" (but App Password doesn't need that)

### **Puppeteer errors:**
- Ensure Chromium is installed: `which chromium-browser`
- Try `headless: false` in index.js to debug visually
- Update npm packages: `npm update`

---

## 📚 **Resources**

### **Reddit Guidelines**
- Reddit Content Policy: https://www.redditinc.com/policies/content-policy
- Self-promotion guidelines: https://www.reddit.com/wiki/selfpromotion
- Each subreddit has specific rules - read before posting

### **Twitter Automation Rules**
- Twitter Automation Rules: https://help.twitter.com/en/rules-and-policies/twitter-automation
- Spam Policy: https://help.twitter.com/en/rules-and-policies/twitter-spam
- Developer Agreement (if using API): https://developer.twitter.com/en/developer-terms/agreement

### **Baby Food Safety Data**
- Congressional Report (2021): exposes-baby-food-industry
- Consumer Reports Baby Food Tests
- FDA Total Diet Study
- Healthy Babies Bright Futures

---

## ✅ **Status**

- [x] Reddit automation script created
- [x] Twitter automation script created
- [x] Credentials configured
- [x] Email reporting configured (pending Gmail App Password)
- [x] Dry-run testing complete
- [ ] Reddit karma building (pending manual)
- [ ] Twitter account warm-up (pending manual)
- [ ] Campaign launch (ready when prep complete)

---

**Next Actions:**
1. Manually build Reddit karma (20-30 helpful comments)
2. Manually warm up Twitter (follow, post, engage for 2-3 days)
3. Set up Gmail App Password (if you want email reports)
4. Run dry-run tests
5. Launch campaigns starting with Reddit (higher traffic potential)

Questions? Just ask.
