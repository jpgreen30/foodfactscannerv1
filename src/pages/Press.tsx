import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  ArrowLeft,
  Download,
  FileText,
  Image,
  Palette,
  Mail,
  Building2,
  Users,
  ScanBarcode,
  Heart,
  Shield,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useState } from "react";
import { toast } from "sonner";

const brandColors = [
  { name: "Primary Teal", hex: "#3D8B8B", hsl: "175 40% 40%", usage: "Main brand color, CTAs, highlights" },
  { name: "Accent Orange", hex: "#F5A623", hsl: "40 90% 55%", usage: "Secondary accents, checkmarks, CTAs" },
  { name: "Safe Teal", hex: "#3D8B8B", hsl: "175 50% 40%", usage: "Positive indicators, safe products" },
  { name: "Caution Orange", hex: "#F59E0B", hsl: "30 96% 50%", usage: "Warnings, moderate risk" },
  { name: "Danger Red", hex: "#EF4444", hsl: "0 84% 60%", usage: "Alerts, high risk, toxic ingredients" },
  { name: "Background", hex: "#F7F4EF", hsl: "40 25% 96%", usage: "Light theme background" },
  { name: "Foreground", hex: "#2D4A4A", hsl: "175 25% 25%", usage: "Text and content" },
];

const factSheet = {
  founded: "2024",
  headquarters: "San Francisco, CA",
  employees: "25+",
  usersProtected: "500,000+",
  productsScanned: "2,000,000+",
  doctorPartners: "500+",
  donatedToResearch: "$50,000+",
};

const pressReleases = [
  {
    date: "January 2025",
    title: "FoodFactScanner Reaches 500,000 Users Milestone",
    summary: "Company celebrates protecting half a million families from harmful food ingredients.",
  },
  {
    date: "December 2024",
    title: "Partnership with American Cancer Society Announced",
    summary: "10% of all premium subscriptions now directly fund cancer research initiatives.",
  },
  {
    date: "October 2024",
    title: "FDA Data Integration Launch",
    summary: "Real-time FDA recall alerts now integrated into every product scan.",
  },
];

const Press = () => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (text: string, colorName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(colorName);
    toast.success(`Copied ${colorName} color code`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <>
      <Helmet>
        <title>Press Kit | FoodFactScanner® Baby Food Safety Scanner Media Resources</title>
        <meta name="description" content="Download FoodFactScanner® press kit, logos, brand assets, and company information. Media resources for journalists covering baby food safety, toxic ingredients, heavy metals, and FDA recalls." />
        <meta name="keywords" content="FoodFactScanner press kit, baby food safety app media, food safety scanner press resources, baby food scanner brand assets" />
        <link rel="canonical" href="https://foodfactscanner.com/press" />
        <meta property="og:url" content="https://foodfactscanner.com/press" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/about" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">About</span>
            </Link>
            <Logo size="sm" />
            <div className="w-20" />
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Press Kit</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-foreground mb-6">
                Media <span className="text-primary">Resources</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Everything you need to cover FoodFactScanner. Download our logos, brand assets, and get the facts about our mission.
              </p>

              <a href="mailto:press@foodfactscanner.com">
                <Button size="lg" className="gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Press Team
                </Button>
              </a>
            </motion.div>
          </div>
        </section>

        {/* Company Fact Sheet */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wide">Company Fact Sheet</span>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">At a Glance</h2>
              <p className="text-muted-foreground">Key facts and figures about FoodFactScanner</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-card border border-border rounded-xl p-6">
                <p className="text-sm text-muted-foreground mb-1">Founded</p>
                <p className="text-2xl font-bold text-foreground">{factSheet.founded}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <p className="text-sm text-muted-foreground mb-1">Headquarters</p>
                <p className="text-2xl font-bold text-foreground">{factSheet.headquarters}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <p className="text-sm text-muted-foreground mb-1">Team Size</p>
                <p className="text-2xl font-bold text-foreground">{factSheet.employees}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <p className="text-sm text-muted-foreground mb-1">Users Protected</p>
                <p className="text-2xl font-bold text-safe">{factSheet.usersProtected}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ScanBarcode className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{factSheet.productsScanned}</p>
                  <p className="text-sm text-muted-foreground">Products Scanned</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-safe/10 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-safe" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{factSheet.doctorPartners}</p>
                  <p className="text-sm text-muted-foreground">Doctor Partners</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
                  <Heart className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{factSheet.donatedToResearch}</p>
                  <p className="text-sm text-muted-foreground">Donated to Research</p>
                </div>
              </div>
            </div>

            {/* Boilerplate */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-8 bg-card border border-border rounded-xl p-6"
            >
              <h3 className="font-bold text-foreground mb-3">About FoodFactScanner</h3>
              <p className="text-muted-foreground leading-relaxed">
                FoodFactScanner is a health technology company on a mission to make food transparency accessible to everyone. 
                By combining AI-powered ingredient analysis with FDA and CDC data, we help millions of families make informed 
                decisions about what they eat. Recommended by over 500 healthcare professionals and aligned with government 
                health initiatives, FoodFactScanner is the trusted choice for consumers who want to know the truth about 
                their food. A portion of every premium subscription supports cancer research.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Logo Assets */}
        <section className="py-16">
          <div className="container max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="flex items-center gap-2 mb-4">
                <Image className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wide">Logo Assets</span>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Brand Logos</h2>
              <p className="text-muted-foreground">Download our official logos for press and media use</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Primary Logo - Dark */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="bg-foreground p-8 flex items-center justify-center min-h-[160px]">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Shield className="w-10 h-10 text-primary" />
                      <ScanBarcode className="w-5 h-5 text-background absolute bottom-0 right-0" />
                    </div>
                    <span className="text-2xl font-black text-background">FoodFactScanner</span>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Primary Logo (Dark BG)</p>
                    <p className="text-sm text-muted-foreground">PNG, SVG</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </motion.div>

              {/* Primary Logo - Light */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="bg-background border-b border-border p-8 flex items-center justify-center min-h-[160px]">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Shield className="w-10 h-10 text-primary" />
                      <ScanBarcode className="w-5 h-5 text-foreground absolute bottom-0 right-0" />
                    </div>
                    <span className="text-2xl font-black text-foreground">FoodFactScanner</span>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Primary Logo (Light BG)</p>
                    <p className="text-sm text-muted-foreground">PNG, SVG</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </motion.div>

              {/* Icon Only */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="bg-muted/50 p-8 flex items-center justify-center min-h-[160px]">
                  <div className="relative">
                    <Shield className="w-16 h-16 text-primary" />
                    <ScanBarcode className="w-8 h-8 text-foreground absolute bottom-0 right-0" />
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Icon Only</p>
                    <p className="text-sm text-muted-foreground">PNG, SVG, ICO</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </motion.div>

              {/* Full Brand Kit */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-primary/10 to-safe/10 border border-primary/20 rounded-xl overflow-hidden"
              >
                <div className="p-8 flex flex-col items-center justify-center min-h-[160px] text-center">
                  <FileText className="w-12 h-12 text-primary mb-3" />
                  <p className="font-bold text-foreground">Complete Brand Kit</p>
                  <p className="text-sm text-muted-foreground">All logos, icons, and guidelines</p>
                </div>
                <div className="p-4 flex items-center justify-between bg-card/50">
                  <div>
                    <p className="font-medium text-foreground">Full Package</p>
                    <p className="text-sm text-muted-foreground">ZIP (12 MB)</p>
                  </div>
                  <Button size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download All
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Brand Colors */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wide">Brand Colors</span>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Color Palette</h2>
              <p className="text-muted-foreground">Official brand colors with usage guidelines</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brandColors.map((color, index) => (
                <motion.div
                  key={color.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                >
                  <div 
                    className="h-24 w-full" 
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-foreground">{color.name}</p>
                      <button
                        onClick={() => copyToClipboard(color.hex, color.name)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copiedColor === color.name ? (
                          <Check className="w-4 h-4 text-safe" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm font-mono text-muted-foreground mb-1">{color.hex}</p>
                    <p className="text-xs text-muted-foreground">{color.usage}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Press Releases */}
        <section className="py-16">
          <div className="container max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wide">Press Releases</span>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Recent Announcements</h2>
              <p className="text-muted-foreground">Latest news and updates from FoodFactScanner</p>
            </motion.div>

            <div className="space-y-4">
              {pressReleases.map((release, index) => (
                <motion.div
                  key={release.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-primary font-medium mb-1">{release.date}</p>
                      <h3 className="text-lg font-bold text-foreground mb-2">{release.title}</h3>
                      <p className="text-muted-foreground">{release.summary}</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 shrink-0">
                      Read More
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Media Contact */}
        <section className="py-16 bg-gradient-to-r from-primary/10 to-safe/10">
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Mail className="w-10 h-10 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Media Inquiries
              </h2>
              <p className="text-muted-foreground mb-6">
                For press inquiries, interviews, or additional information, please contact our media relations team.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="mailto:press@foodfactscanner.com">
                  <Button size="lg" className="gap-2">
                    <Mail className="w-5 h-5" />
                    press@foodfactscanner.com
                  </Button>
                </a>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Response time: Within 24 hours on business days
              </p>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-border">
          <div className="container max-w-5xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-4 text-sm">
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                About Us
              </Link>
              <span className="text-muted-foreground/30">|</span>
              <Link to="/team" className="text-muted-foreground hover:text-foreground transition-colors">
                Our Team
              </Link>
              <span className="text-muted-foreground/30">|</span>
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <span className="text-muted-foreground/30">|</span>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
            <p className="text-muted-foreground/50 text-sm mt-4">
              © 2025 FoodFactScanner.com. Your health is not negotiable.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Press;
