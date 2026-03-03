#!/usr/bin/env node
// Manual tweeting helper - prints all tweet drafts

const tweets = [
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
];

console.log('='.repeat(70));
console.log('FOODFACTSCANNER - TWEET DRAFTS FOR MANUAL POSTING');
console.log('='.repeat(70));
console.log('\nCopy each tweet and post manually to @foodfactscanner\n');

tweets.forEach((t, idx) => {
  console.log(`${idx + 1}. ${t.text}\n`);
  console.log('-'.repeat(70) + '\n');
});

console.log('POSTING SCHEDULE:');
console.log('- Tweet 1 now');
console.log('- Tweet 2 in 3 hours');
console.log('- Tweet 3 in 6 hours');
console.log('- Tweet 4 in 9 hours');
console.log('- Tweet 5 in 12 hours');
console.log('\nUse UTM: foodfactscanner.com?utm_source=twitter&utm_medium=social');
console.log('Respond to all replies/mentions within 1-2 hours.');
console.log('='.repeat(70));
