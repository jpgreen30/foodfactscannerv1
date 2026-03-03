import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Shield, Database, Users, FileText, Lock, Mail, Globe, Baby, Clock, Download } from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PrivacyPolicy = () => {
  const lastUpdated = "February 27, 2026";

  const sections = [
    {
      id: "information-collected",
      icon: Database,
      title: "1. Information We Collect",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Account Information</h4>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
              <li>Email address (for account creation and login)</li>
              <li>First and last name (optional, for personalization)</li>
              <li>Phone number (optional, for SMS recall alerts)</li>
              <li>Password (encrypted, never stored in plain text)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-2">Health Information</h4>
            <p className="text-muted-foreground text-sm mb-2">
              To provide personalized health warnings, we collect:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
              <li>Health conditions (diabetes, heart disease, hypertension, etc.)</li>
              <li>Allergies (nuts, dairy, gluten, shellfish, etc.)</li>
              <li>Dietary preferences (vegan, gluten-free, dairy-free)</li>
              <li>Pregnancy status (for ingredient safety warnings)</li>
              <li>Age group (for age-appropriate recommendations)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-2">Product Scan Data</h4>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
              <li>Barcodes scanned</li>
              <li>Product names and brands</li>
              <li>Ingredients analyzed</li>
              <li>Health scores calculated</li>
              <li>Scan timestamps</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-2">Family Profile Data</h4>
            <p className="text-muted-foreground text-sm">
              If you create family profiles, we store names, relationships, and health information 
              for each family member to provide personalized warnings.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-2">Device Information</h4>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
              <li>Push notification tokens (for sending alerts)</li>
              <li>Device type and platform (iOS, Android, Web)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-2">Legal Inquiry Data (With Explicit Consent)</h4>
            <p className="text-muted-foreground text-sm">
              If you request a legal consultation regarding toxic product exposure:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
              <li>Contact information (name, phone, email)</li>
              <li>Injury descriptions</li>
              <li>Products you've been exposed to</li>
              <li>Consent timestamp and acknowledgment</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "how-we-use",
      icon: FileText,
      title: "2. How We Use Your Information",
      content: (
        <div className="space-y-3 text-muted-foreground text-sm">
          <p><strong className="text-foreground">Personalized Health Alerts:</strong> Your health conditions and allergies help us flag dangerous ingredients specific to you.</p>
          <p><strong className="text-foreground">Recall Notifications:</strong> We use your scan history and contact preferences to alert you if a product you've purchased is recalled.</p>
          <p><strong className="text-foreground">Family Protection:</strong> Family profile data enables warnings tailored to each family member.</p>
          <p><strong className="text-foreground">Legal Resources:</strong> With your explicit consent, we connect you with partner law firms if you've been exposed to harmful products.</p>
          <p><strong className="text-foreground">Service Improvement:</strong> Aggregated, anonymized data helps us improve our AI analysis and product database.</p>
          <p><strong className="text-foreground">Subscription Management:</strong> Payment processing for premium features (handled by Stripe).</p>
        </div>
      ),
    },
    {
      id: "information-sharing",
      icon: Users,
      title: "3. Information Sharing & Third Parties",
      content: (
        <div className="space-y-4">
          <div className="p-3 bg-danger/10 rounded-lg border border-danger/30">
            <p className="text-sm font-semibold text-danger mb-1">Important:</p>
            <p className="text-sm text-muted-foreground">
              We never sell your personal data. We only share information as described below.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-2">Partner Law Firms</h4>
            <p className="text-muted-foreground text-sm">
              <strong>Only when you explicitly request a legal consultation</strong> by checking the consent box and submitting the form. 
              We share your contact information, injury details, and product exposure history with vetted partner law firms.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-2">Payment Processor (Stripe)</h4>
            <p className="text-muted-foreground text-sm">
              Stripe processes subscription payments. We never store your credit card numbers. 
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                Stripe's Privacy Policy →
              </a>
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-2">Email Provider (Resend)</h4>
            <p className="text-muted-foreground text-sm">
              We use Resend to send transactional emails (recall alerts, account notifications). 
              Only your email address is shared for this purpose.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-2">AI Analysis Services</h4>
            <p className="text-muted-foreground text-sm">
              Product ingredients are processed by AI services (OpenAI, Google) to generate health assessments. 
              This data is processed but not permanently stored by these providers.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-2">Automation Services (Zapier)</h4>
            <p className="text-muted-foreground text-sm">
              Admin-configured webhooks may send lead data to CRM systems. This is used only for business operations.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "ai-disclaimer",
      icon: FileText,
      title: "4. AI-Generated Content Disclaimer",
      content: (
        <div className="space-y-3 text-muted-foreground text-sm">
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
            <p className="font-semibold text-foreground mb-1">Important:</p>
            <p>All scan results, health scores, and ingredient analysis are <strong className="text-foreground">AI-generated</strong> and are not a substitute for professional medical advice.</p>
          </div>
          <p><strong className="text-foreground">AI Processing:</strong> We use large language models (LLMs) to analyze food labels and ingredients. These models may produce inaccurate, incomplete, or outdated results.</p>
          <p><strong className="text-foreground">No Medical Advice:</strong> AI-generated content does not constitute medical, nutritional, or legal advice. Always consult qualified professionals.</p>
          <p><strong className="text-foreground">Data Usage:</strong> Ingredient data sent to AI providers is processed in real-time and is not permanently stored by third-party AI services.</p>
          <p><strong className="text-foreground">Limitations:</strong> Risk assessments are based on publicly available research and may not reflect the latest scientific consensus or regulatory changes.</p>
        </div>
      ),
    },
    {
      id: "data-retention",
      icon: Clock,
      title: "5. Data Retention",
      content: (
        <div className="space-y-3 text-muted-foreground text-sm">
          <p><strong className="text-foreground">Account Data:</strong> Retained until you delete your account.</p>
          <p><strong className="text-foreground">Scan History:</strong> Free tier: 7 days. Basic: 30 days. Premium/Annual: unlimited.</p>
          <p><strong className="text-foreground">Legal Leads:</strong> Retained for the legally required period for potential litigation (typically 3-7 years depending on jurisdiction).</p>
          <p><strong className="text-foreground">Analytics Data:</strong> Aggregated and anonymized after 90 days.</p>
          <p><strong className="text-foreground">Push Notification Tokens:</strong> Automatically removed when you uninstall the app or revoke permissions.</p>
          <p><strong className="text-foreground">Data Deletion:</strong> You may request full deletion at any time by emailing <a href="mailto:privacy@foodfactscanner.com" className="text-primary hover:underline">privacy@foodfactscanner.com</a>.</p>
        </div>
      ),
    },
    {
      id: "your-rights",
      icon: Shield,
      title: "6. Your Rights (GDPR/CCPA)",
      content: (
        <div className="space-y-4">
          <div className="grid gap-3">
            <div className="p-3 bg-muted rounded-lg border border-border">
              <h4 className="font-semibold text-foreground mb-1">Right to Access</h4>
              <p className="text-muted-foreground text-sm">Request a copy of all personal data we hold about you.</p>
            </div>
            
            <div className="p-3 bg-muted rounded-lg border border-border">
              <h4 className="font-semibold text-foreground mb-1">Right to Correction</h4>
              <p className="text-muted-foreground text-sm">Update or correct inaccurate personal information.</p>
            </div>
            
            <div className="p-3 bg-muted rounded-lg border border-border">
              <h4 className="font-semibold text-foreground mb-1">Right to Deletion</h4>
              <p className="text-muted-foreground text-sm">Request deletion of your account and associated data (subject to legal retention requirements).</p>
            </div>
            
            <div className="p-3 bg-muted rounded-lg border border-border">
              <h4 className="font-semibold text-foreground mb-1">Right to Data Portability</h4>
              <p className="text-muted-foreground text-sm">Receive your data in a machine-readable format.</p>
            </div>
            
            <div className="p-3 bg-muted rounded-lg border border-border">
              <h4 className="font-semibold text-foreground mb-1">Right to Opt-Out</h4>
              <p className="text-muted-foreground text-sm">Opt out of marketing communications and SMS alerts at any time.</p>
            </div>
            
            <div className="p-3 bg-muted rounded-lg border border-border">
              <h4 className="font-semibold text-foreground mb-1">Right to Withdraw Consent</h4>
              <p className="text-muted-foreground text-sm">Withdraw consent for data processing where consent is the legal basis.</p>
            </div>
          </div>
          
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
            <p className="text-sm text-foreground">
              <strong>To exercise these rights:</strong> Email us at{" "}
              <a href="mailto:privacy@foodfactscanner.com" className="text-primary hover:underline">
                privacy@foodfactscanner.com
              </a>{" "}
              or use the "Privacy & Data" section in your profile settings.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-2">California Residents (CCPA)</h4>
            <p className="text-muted-foreground text-sm">
              California residents have additional rights under the California Consumer Privacy Act, including 
              the right to know what personal information is collected, the right to delete, and the right 
              to opt-out of the sale of personal information. <strong>We do not sell your personal information.</strong>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "children",
      icon: Baby,
      title: "7. Children's Privacy (COPPA)",
      content: (
        <div className="space-y-3 text-muted-foreground text-sm">
          <p>
            FoodFactScanner.com complies with the Children's Online Privacy Protection Act (COPPA). 
            Our service is <strong className="text-foreground">not directed to children under 13</strong> years of age. 
            We do not knowingly collect personal information from children under 13 without verifiable parental consent.
          </p>
          <p>
            If you are a parent or guardian and believe your child has provided us with personal information, 
            please contact us at{" "}
            <a href="mailto:privacy@foodfactscanner.com" className="text-primary hover:underline">
              privacy@foodfactscanner.com
            </a>
            . We will promptly take steps to delete such information.
          </p>
          <p>
            Family profiles for children are created and managed by parents/guardians under the parent's account. 
            Health information for minors is stored under the parent's account and subject to parental control.
          </p>
        </div>
      ),
    },
    {
      id: "security",
      icon: Lock,
      title: "8. Security Measures",
      content: (
        <div className="space-y-3 text-muted-foreground text-sm">
          <p><strong className="text-foreground">Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256).</p>
          <p><strong className="text-foreground">Access Controls:</strong> Row-level security ensures users can only access their own data.</p>
          <p><strong className="text-foreground">Authentication:</strong> Secure authentication with password hashing and optional OAuth providers.</p>
          <p><strong className="text-foreground">Regular Audits:</strong> We conduct regular security assessments and vulnerability testing.</p>
          <p><strong className="text-foreground">Infrastructure:</strong> Hosted on secure, SOC 2 compliant cloud infrastructure.</p>
        </div>
      ),
    },
    {
      id: "cookies",
      icon: Globe,
      title: "9. Cookies & Local Storage",
      content: (
        <div className="space-y-3 text-muted-foreground text-sm">
          <p>We use minimal cookies and local storage for essential functionality:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-foreground">Session cookies:</strong> For authentication and keeping you logged in</li>
            <li><strong className="text-foreground">Local storage:</strong> For user preferences and app state</li>
          </ul>
          <p>
            We do not use third-party tracking cookies or advertising cookies. 
            We do not sell your data to advertisers.
          </p>
        </div>
      ),
    },
    {
      id: "changes",
      icon: FileText,
      title: "10. Changes to This Policy",
      content: (
        <div className="space-y-3 text-muted-foreground text-sm">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Posting the new policy on this page with an updated "Last Updated" date</li>
            <li>Sending an email notification for significant changes</li>
            <li>Displaying an in-app notification</li>
          </ul>
          <p>
            We encourage you to review this Privacy Policy periodically. Your continued use of the service 
            after changes constitutes acceptance of the updated policy.
          </p>
        </div>
      ),
    },
    {
      id: "contact",
      icon: Mail,
      title: "11. Contact Us",
      content: (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            If you have questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="p-4 bg-muted rounded-lg border border-border space-y-2">
            <p className="text-sm">
              <strong className="text-foreground">Email:</strong>{" "}
              <a href="mailto:privacy@foodfactscanner.com" className="text-primary hover:underline">
                privacy@foodfactscanner.com
              </a>
            </p>
            <p className="text-sm">
              <strong className="text-foreground">Data Protection Officer:</strong>{" "}
              <a href="mailto:dpo@foodfactscanner.com" className="text-primary hover:underline">
                dpo@foodfactscanner.com
              </a>
            </p>
          </div>
          <p className="text-muted-foreground text-sm">
            We will respond to all requests within 30 days, or sooner as required by applicable law.
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
    <Helmet>
      <title>Privacy Policy | FoodFactScanner® Baby Food Safety Scanner</title>
      <meta name="description" content="Read FoodFactScanner®'s privacy policy. Learn how we protect your data while using our baby food safety scanner, ingredient checker, and heavy metals detection app." />
      <link rel="canonical" href="https://foodfactscanner.com/privacy" />
      <meta property="og:url" content="https://foodfactscanner.com/privacy" />
      <meta name="robots" content="index, follow" />
    </Helmet>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <Logo size="sm" />
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-8">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-6 bg-card rounded-xl border border-border"
        >
          <p className="text-foreground/80 leading-relaxed">
            At FoodFactScanner.com, we take your privacy seriously. This Privacy Policy explains how we collect, 
            use, and protect your personal information when you use our food safety scanning application. 
            We are committed to transparency and giving you control over your data.
          </p>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 p-4 bg-primary/10 rounded-xl border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <Download className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Your Data Rights</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            You can request a copy of your data, update your information, or delete your account at any time.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="mailto:privacy@foodfactscanner.com?subject=Data%20Access%20Request"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Request My Data
            </a>
            <a
              href="mailto:privacy@foodfactscanner.com?subject=Account%20Deletion%20Request"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors border border-border"
            >
              Delete Account
            </a>
          </div>
        </motion.div>

        {/* Accordion Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {sections.map((section) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="border border-border rounded-xl px-4 bg-card"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <section.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  {section.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 pt-8 border-t border-border text-center"
        >
          <div className="flex items-center justify-center gap-4 text-sm">
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <a href="mailto:privacy@foodfactscanner.com" className="text-primary hover:underline">
              Contact Privacy Team
            </a>
          </div>
        </motion.div>
      </main>
    </div>
    </>
  );
};

export default PrivacyPolicy;
