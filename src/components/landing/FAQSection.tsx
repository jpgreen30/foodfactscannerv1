import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Is it true that 97% of baby food is contaminated?",
    answer: "Yes. A 2021 congressional report found that 95-97% of baby foods contain detectable levels of toxic heavy metals like arsenic, lead, cadmium, and mercury. These are not trace amounts — many exceed FDA limits. Our scanner tests for these exact toxins so you can avoid the worst brands."
  },
  {
    question: "What should I do if my baby has been eating contaminated food?",
    answer: "First, stop feeding that product immediately. Document the brand, batch number, and how long your child consumed it. We recommend consulting your pediatrician and considering your legal options. Many families affected by heavy metal exposure are eligible for compensation through mass tort lawsuits. We can help connect you with specialized attorneys."
  },
  {
    question: "Can I get compensation if my child was harmed by baby food?",
    answer: "Yes. Thousands of families are pursuing legal action against baby food manufacturers for knowingly selling products with dangerous heavy metal levels. If your child consumed contaminated baby food and shows symptoms (developmental delays, learning issues, ADHD), you may qualify for a settlement. Our scanner flags high-risk products and can help you start a legal claim."
  },
  {
    question: "How does the scanner detect heavy metals?",
    answer: "We've tested 32 leading baby food brands in an independent lab. Our database contains the exact arsenic, lead, cadmium, and mercury levels for each product. When you scan a barcode, we instantly look up the results and give you a risk score from 0-100. If it's above 70, we flag it as HIGH RISK and recommend alternatives."
  },
  {
    question: "Why haven't these baby foods been recalled?",
    answer: "Unfortunately, the FDA's current limits for heavy metals in baby food are dangerously high, and many products technically 'comply' while still being unsafe. That's why we created this scanner — to give parents a tool the FDA refuses to provide. We also monitor real recall alerts and notify you instantly if a product is officially pulled from shelves."
  },
  {
    question: "How accurate is the food safety analysis?",
    answer: "Our heavy metal data comes from certified laboratory testing, not manufacturer claims. We update our database whenever new lab results or FDA recalls become available. For ingredient analysis, we cross-reference thousands of additives against peer-reviewed toxicology studies and international safety databases (EU, WHO)."
  },
  {
    question: "Does it check for FDA food recalls?",
    answer: "Absolutely! We integrate with the FDA's recall database in real-time. If any product you've scanned is recalled for contamination, undeclared allergens, or safety concerns, you'll receive instant notifications. But remember: most dangerous baby foods aren't recalled — they're legally sold. That's why our own toxin database is critical."
  },
  {
    question: "Can I scan medication barcodes for drug interactions?",
    answer: "Yes! Our drug interaction checker lets you scan medication barcodes and check for dangerous interactions with your current medications, supplements, and even certain foods. We'll alert you to potential side effects and contraindications based on your complete medication profile."
  },
  {
    question: "Is there a family profile feature for multiple children?",
    answer: "Yes. Parents can create separate profiles for each child, tracking their age, allergies, and scan history. This lets us provide age-specific warnings (e.g., infants are more vulnerable to heavy metals) and stage-based recommendations as your child grows. Soon we'll add pregnancy tracking too."
  },
  {
    question: "What happens when my 10 free scans run out?",
    answer: "You'll see a clear message that you've used all free scans. At that point, you can either upgrade to a paid plan (Basic $9.99/mo for 20 scans, Premium $24.99/mo unlimited) or wait until next month when we reset free users to 10 scans. But we strongly recommend upgrading — one high-risk scan could save your child's development."
  },
  {
    question: "Is my data private? Can law firms see my scans?",
    answer: "Your scan data is anonymized unless you explicitly opt into legal consultation. We aggregate data for research, but we never sell your personal information. If you click 'Get Legal Help' after a high-risk scan, that creates a separate, consent-based intake with our legal partners. You control your data and can delete it anytime."
  }
];

const FAQSection = () => {
  return (
    <section className="py-16 sm:py-20 bg-muted/30" id="faq">
      <div className="container max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Know
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get answers to common questions about our food barcode scanner, ingredient checker, and health analysis features.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border border-border rounded-lg px-6 data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* FAQ Schema for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              }))
            })
          }}
        />
      </div>
    </section>
  );
};

export default FAQSection;
