import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  ArrowLeft,
  Stethoscope,
  Award,
  GraduationCap,
  BookOpen,
  Heart,
  Users,
  Linkedin
} from "lucide-react";
import { Logo } from "@/components/Logo";

const advisoryBoard = [
  {
    name: "Dr. Sarah Mitchell, MD",
    role: "Chief Medical Advisor",
    specialty: "Family Medicine",
    credentials: "Board-Certified Family Physician",
    institution: "Johns Hopkins Medicine",
    bio: "With over 20 years of experience in family medicine, Dr. Mitchell specializes in preventive care and nutrition counseling. She has published extensively on the relationship between processed food consumption and chronic disease.",
    color: "bg-primary",
  },
  {
    name: "Dr. Michael Chen, MD, MPH",
    role: "Nutrition Science Lead",
    specialty: "Internal Medicine & Public Health",
    credentials: "Board-Certified Internist",
    institution: "Stanford Health",
    bio: "Dr. Chen combines his expertise in internal medicine with public health to address the growing epidemic of diet-related diseases. He advises on ingredient safety scoring and FDA compliance.",
    color: "bg-safe",
  },
  {
    name: "Dr. Emily Rodriguez, PhD, RD",
    role: "Dietary Science Director",
    specialty: "Clinical Nutrition",
    credentials: "Registered Dietitian Nutritionist",
    institution: "Mayo Clinic",
    bio: "A leading researcher in food additives and their metabolic effects, Dr. Rodriguez ensures our ingredient analysis reflects the latest peer-reviewed nutritional science.",
    color: "bg-blue-500",
  },
  {
    name: "Dr. James Thompson, MD, PhD",
    role: "Toxicology Advisor",
    specialty: "Toxicology & Pharmacology",
    credentials: "Board-Certified Medical Toxicologist",
    institution: "Cleveland Clinic",
    bio: "Dr. Thompson brings 15 years of expertise in chemical toxicology to evaluate potentially harmful food additives and their long-term health implications.",
    color: "bg-caution",
  },
  {
    name: "Dr. Angela Park, MD, FAAP",
    role: "Pediatric Health Advisor",
    specialty: "Pediatric Medicine",
    credentials: "Board-Certified Pediatrician",
    institution: "Children's Hospital of Philadelphia",
    bio: "Specializing in childhood nutrition and development, Dr. Park ensures our recommendations are safe and appropriate for children of all ages.",
    color: "bg-pink-500",
  },
  {
    name: "Dr. Robert Williams, PhD",
    role: "Food Science Director",
    specialty: "Food Chemistry",
    credentials: "Food Science Researcher",
    institution: "Cornell University",
    bio: "With decades of research in food chemistry and processing, Dr. Williams helps us understand how food manufacturing affects ingredient safety and nutritional value.",
    color: "bg-purple-500",
  },
];

const researchPartners = [
  { name: "American Heart Association", focus: "Cardiovascular Health" },
  { name: "American Diabetes Association", focus: "Metabolic Health" },
  { name: "Academy of Nutrition and Dietetics", focus: "Dietary Guidelines" },
  { name: "Environmental Working Group", focus: "Chemical Safety" },
];

const Team = () => {
  return (
    <>
      <Helmet>
        <title>Our Team | FoodFactScanner® Medical Advisory Board & Baby Food Safety Experts</title>
        <meta name="description" content="Meet the board-certified doctors, pediatric nutritionists, and food safety scientists behind FoodFactScanner®. Our medical advisory board ensures all baby food safety recommendations are clinically accurate and evidence-based." />
        <meta name="keywords" content="baby food safety experts, pediatric nutritionist baby food, food safety medical advisory board, baby food toxin experts, baby food safety doctors" />
        <link rel="canonical" href="https://foodfactscanner.com/team" />
        <meta property="og:url" content="https://foodfactscanner.com/team" />
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
        <section className="py-16 md:py-24 bg-gradient-to-b from-safe/5 to-background">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 bg-safe/10 rounded-full px-4 py-2 mb-6">
                <Stethoscope className="w-4 h-4 text-safe" />
                <span className="text-sm font-semibold text-safe">Medical Advisory Board</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-foreground mb-6">
                Guided by <span className="text-safe">Leading Experts</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our medical advisory board includes physicians, researchers, and nutritionists from the nation's top healthcare institutions.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Credentials Bar */}
        <section className="py-8 bg-muted/30 border-y border-border">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">6 Board-Certified Experts</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="w-5 h-5 text-safe" />
                <span className="text-sm font-medium">100+ Years Combined Experience</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">500+ Published Studies</span>
              </div>
            </div>
          </div>
        </section>

        {/* Advisory Board Grid */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">Meet Our Advisors</h2>
              <p className="text-muted-foreground">The experts ensuring every recommendation is medically sound</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advisoryBoard.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  {/* Avatar Header */}
                  <div className={`${member.color} p-6 flex items-center justify-center`}>
                    <div className="w-24 h-24 rounded-full bg-background/20 flex items-center justify-center">
                      <Stethoscope className="w-12 h-12 text-white/90" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-foreground mb-1">{member.name}</h3>
                    <p className="text-sm font-medium text-primary mb-2">{member.role}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-xs bg-muted rounded-full px-2 py-1 text-muted-foreground">
                        {member.specialty}
                      </span>
                      <span className="text-xs bg-muted rounded-full px-2 py-1 text-muted-foreground">
                        {member.institution}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {member.bio}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Award className="w-4 h-4 text-safe" />
                      <span>{member.credentials}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Research Partners */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wide">Research Partners</span>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Collaborating with Leading Organizations
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We partner with respected health organizations to ensure our data reflects the latest research.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {researchPartners.map((partner, index) => (
                <motion.div
                  key={partner.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm mb-1">{partner.name}</h3>
                  <p className="text-xs text-muted-foreground">{partner.focus}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Join CTA */}
        <section className="py-16 bg-gradient-to-r from-safe/10 to-primary/10">
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Linkedin className="w-10 h-10 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Are You a Healthcare Professional?
              </h2>
              <p className="text-muted-foreground mb-6">
                We're always looking for qualified medical professionals to join our advisory network. Help us make food transparency the standard.
              </p>
              <a 
                href="mailto:advisory@foodfactscanner.com" 
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Contact Our Team
              </a>
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
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <span className="text-muted-foreground/30">|</span>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
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

export default Team;
