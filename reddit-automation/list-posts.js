#!/usr/bin/env node
// Manual posting helper - prints all posts ready to copy/paste

const posts = [
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
];

console.log('='.repeat(70));
console.log('FOODFACTSCANNER - REDDIT POSTS FOR MANUAL PUBLISHING');
console.log('='.repeat(70));
console.log('\nCopy each block and paste into Reddit manually.\n');

posts.forEach((post, idx) => {
  console.log(`\n${idx + 1}. POST TO r/${post.subreddit}`);
  console.log('-'.repeat(70));
  console.log(`Title: ${post.title}\n`);
  console.log('Content:');
  console.log(post.content);
  console.log('\n' + '-'.repeat(70) + '\n');
});

console.log('POSTING ORDER:');
console.log('1. Build karma first (comment in subreddits without self-promoting)');
console.log('2. Post #1, wait 2+ hours');
console.log('3. Post #2, etc.');
console.log('4. Monitor comments and reply within a few hours');
console.log('\nUse UTM parameters: https://foodfactscanner.com?utm_source=reddit&utm_medium=social');
console.log('='.repeat(70));
