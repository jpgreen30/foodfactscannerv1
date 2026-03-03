import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, FileText, Scale, AlertTriangle, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";

const Terms = () => {
  const lastUpdated = "February 27, 2026";

  return (
    <>
    <Helmet>
      <title>Terms of Service | FoodFactScanner® Baby Food Safety Scanner App</title>
      <meta name="description" content="Read FoodFactScanner®'s terms of service. Understand your rights and responsibilities when using our baby food safety scanner, toxic ingredient checker, and heavy metals detection app." />
      <link rel="canonical" href="https://foodfactscanner.com/terms" />
      <meta property="og:url" content="https://foodfactscanner.com/terms" />
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
            <Scale className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-gray max-w-none space-y-8"
        >
          {/* Introduction */}
          <section className="p-6 bg-card rounded-xl border border-border">
            <p className="text-foreground/80 leading-relaxed">
              Welcome to FoodFactScanner.com. These Terms of Service ("Terms") govern your use of our application 
              and services. By accessing or using FoodFactScanner.com, you agree to be bound by these Terms.
            </p>
          </section>

          {/* Sections */}
          <section className="space-y-6">
            <div className="p-4 bg-card rounded-xl border border-border">
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground text-sm">
                By creating an account or using our services, you acknowledge that you have read, 
                understood, and agree to be bound by these Terms. If you do not agree, please do not use our services.
              </p>
            </div>

            <div className="p-4 bg-card rounded-xl border border-border">
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                2. Service Description
              </h2>
              <p className="text-muted-foreground text-sm mb-3">
                FoodFactScanner.com provides food product scanning and analysis services, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>Barcode and label scanning for ingredient analysis</li>
                <li>Personalized health warnings based on your profile</li>
                <li>FDA recall notifications</li>
                <li>Family profile management</li>
                <li>Optional legal consultation referrals</li>
              </ul>
            </div>

            <div className="p-4 bg-danger/10 rounded-xl border border-danger/30">
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-danger" />
                3. Medical Disclaimer
              </h2>
              <p className="text-muted-foreground text-sm mb-3">
                <strong className="text-danger">IMPORTANT:</strong> FoodFactScanner.com is not a medical device and does not provide medical advice. 
                Our analysis is for informational purposes only.
              </p>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>Always consult healthcare professionals for medical decisions</li>
                <li>Do not rely solely on our app for allergy or health condition management</li>
                <li>Ingredient databases may contain errors or be incomplete</li>
                <li>AI analysis may occasionally produce inaccurate results</li>
              </ul>
            </div>

            <div className="p-4 bg-primary/10 rounded-xl border border-primary/30">
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                4. AI Disclaimer
              </h2>
              <p className="text-muted-foreground text-sm mb-3">
                FoodFactScanner.com uses artificial intelligence to analyze food labels and ingredients:
              </p>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>All scan results and health scores are <strong className="text-foreground">AI-generated</strong> and are not a substitute for professional medical advice</li>
                <li>AI models may produce inaccurate, incomplete, or outdated results</li>
                <li>Ingredient risk assessments are based on publicly available research and may not reflect the latest scientific consensus</li>
                <li>We do not guarantee the accuracy, completeness, or reliability of AI-generated content</li>
                <li>Users should independently verify critical health and safety information</li>
              </ul>
            </div>

            <div className="p-4 bg-card rounded-xl border border-border">
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Retention Policy</h2>
              <p className="text-muted-foreground text-sm mb-3">
                We retain your data as follows:
              </p>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li><strong className="text-foreground">Account data:</strong> Retained until you request account deletion</li>
                <li><strong className="text-foreground">Scan history:</strong> Free tier: 7 days. Basic: 30 days. Premium/Annual: unlimited</li>
                <li><strong className="text-foreground">Legal leads:</strong> Retained for the legally required period (3–7 years depending on jurisdiction)</li>
                <li><strong className="text-foreground">Analytics data:</strong> Aggregated and anonymized after 90 days</li>
                <li><strong className="text-foreground">Push notification tokens:</strong> Removed when you uninstall or revoke permissions</li>
                <li>You may request deletion of your data at any time by contacting <a href="mailto:privacy@foodfactscanner.com" className="text-primary hover:underline">privacy@foodfactscanner.com</a></li>
              </ul>
            </div>

            <div className="p-4 bg-caution/10 rounded-xl border border-caution/30">
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-caution" />
                6. Children's Privacy (COPPA Compliance)
              </h2>
              <p className="text-muted-foreground text-sm mb-3">
                FoodFactScanner.com is committed to protecting children's privacy:
              </p>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>Our service is <strong className="text-foreground">not directed to children under 13</strong> years of age</li>
                <li>We do not knowingly collect personal information from children under 13 without verifiable parental consent</li>
                <li>Family profiles for minors are created and managed by parents/guardians under the parent's account</li>
                <li>If you believe a child under 13 has provided us with personal information, contact us immediately at <a href="mailto:privacy@foodfactscanner.com" className="text-primary hover:underline">privacy@foodfactscanner.com</a></li>
                <li>We will promptly delete any information found to have been collected from a child under 13</li>
              </ul>
            </div>

            <div className="p-4 bg-card rounded-xl border border-border">
              <h2 className="text-xl font-semibold text-foreground mb-3">7. User Accounts</h2>
              <p className="text-muted-foreground text-sm mb-3">You are responsible for:</p>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and complete information</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </div>

            <div className="p-4 bg-card rounded-xl border border-border">
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Subscription & Payments</h2>
              <p className="text-muted-foreground text-sm mb-3">
                Premium features require a paid subscription:
              </p>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>Subscriptions are billed monthly or annually</li>
                <li>You can cancel at any time; access continues until the end of the billing period</li>
                <li>Refunds are handled on a case-by-case basis</li>
                <li>We reserve the right to change pricing with 30 days notice</li>
              </ul>
            </div>

            <div className="p-4 bg-card rounded-xl border border-border">
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Legal Consultation Referrals</h2>
              <p className="text-muted-foreground text-sm mb-3">
                If you request a legal consultation:
              </p>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>We connect you with independent partner law firms</li>
                <li>We are not a law firm and do not provide legal advice</li>
                <li>Any attorney-client relationship is between you and the law firm</li>
                <li>We may receive compensation for referrals</li>
              </ul>
            </div>

            <div className="p-4 bg-card rounded-xl border border-border">
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Prohibited Uses</h2>
              <p className="text-muted-foreground text-sm mb-3">You agree not to:</p>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>Use the service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Scrape, copy, or redistribute our content without permission</li>
                <li>Impersonate others or provide false information</li>
                <li>Interfere with the proper functioning of the service</li>
              </ul>
            </div>

            <div className="p-4 bg-card rounded-xl border border-border">
              <h2 className="text-xl font-semibold text-foreground mb-3">11. Limitation of Liability</h2>
              <p className="text-muted-foreground text-sm">
                To the maximum extent permitted by law, FoodFactScanner.com and its affiliates shall not be liable 
                for any indirect, incidental, special, consequential, or punitive damages, including 
                loss of profits, data, or health-related injuries arising from your use of our services.
              </p>
            </div>

            <div className="p-4 bg-card rounded-xl border border-border">
              <h2 className="text-xl font-semibold text-foreground mb-3">12. Changes to Terms</h2>
              <p className="text-muted-foreground text-sm">
                We reserve the right to modify these Terms at any time. We will notify you of significant 
                changes via email or in-app notification. Continued use after changes constitutes acceptance.
              </p>
            </div>

            <div className="p-4 bg-card rounded-xl border border-border">
              <h2 className="text-xl font-semibold text-foreground mb-3">13. Contact</h2>
              <p className="text-muted-foreground text-sm">
                For questions about these Terms, please contact us at{" "}
                <a href="mailto:legal@foodfactscanner.com" className="text-primary hover:underline">
                  legal@foodfactscanner.com
                </a>
              </p>
            </div>
          </section>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 pt-8 border-t border-border text-center"
        >
          <div className="flex items-center justify-center gap-4 text-sm">
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <a href="mailto:legal@foodfactscanner.com" className="text-primary hover:underline">
              Contact Us
            </a>
          </div>
        </motion.div>
      </main>
    </div>
    </>
  );
};

export default Terms;
