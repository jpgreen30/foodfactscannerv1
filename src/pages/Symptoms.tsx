import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RecordSymptomsModal } from "@/components/RecordSymptomsModal";
import { 
  Activity, 
  Calendar, 
  AlertTriangle, 
  Package, 
  TrendingUp,
  Clock,
  Users,
  ChevronRight,
  Loader2,
  Plus,
  FileText
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";

interface SymptomEntry {
  symptom: string;
  category: string;
  severity: string;
  duration: string;
  who_affected: string;
  reported_at: string;
}

interface UserSymptom {
  id: string;
  symptom: string;
  category: string | null;
  severity: string | null;
  duration: string | null;
  who_affected: string | null;
  linked_products: any[];
  notes: string | null;
  reported_at: string;
  created_at: string;
}

interface LeadWithSymptoms {
  id: string;
  symptoms: SymptomEntry[];
  symptom_severity: string | null;
  symptom_duration: string | null;
  family_affected: any[];
  toxic_products_exposure: any[];
  created_at: string;
  lead_status: string | null;
}

interface ScanWithToxins {
  id: string;
  product_name: string;
  brand: string | null;
  health_score: number | null;
  ingredients: any;
  created_at: string;
}

const SEVERITY_COLORS = {
  mild: "bg-caution/20 text-caution border-caution/30",
  moderate: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  severe: "bg-danger/20 text-danger border-danger/30",
};

const CATEGORY_ICONS: Record<string, string> = {
  digestive: "🤢",
  neurological: "🧠",
  skin: "🔴",
  allergic: "🤧",
  children: "👶",
};

export default function Symptoms() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadWithSymptoms[]>([]);
  const [userSymptoms, setUserSymptoms] = useState<UserSymptom[]>([]);
  const [toxicScans, setToxicScans] = useState<ScanWithToxins[]>([]);
  const [activeTab, setActiveTab] = useState("timeline");
  const [showRecordModal, setShowRecordModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch standalone symptoms from user_symptoms table
      const { data: symptomsData, error: symptomsError } = await supabase
        .from("user_symptoms")
        .select("*")
        .eq("user_id", user!.id)
        .order("reported_at", { ascending: false });

      if (symptomsError) throw symptomsError;
      setUserSymptoms((symptomsData || []) as UserSymptom[]);

      // Fetch legal leads with symptoms (for backwards compatibility)
      const { data: leadsData, error: leadsError } = await supabase
        .from("legal_leads")
        .select("id, symptoms, symptom_severity, symptom_duration, family_affected, toxic_products_exposure, created_at, lead_status")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (leadsError) throw leadsError;
      setLeads((leadsData || []) as unknown as LeadWithSymptoms[]);

      // Fetch toxic scans (low health scores)
      const { data: scansData, error: scansError } = await supabase
        .from("scan_history")
        .select("id, product_name, brand, health_score, ingredients, created_at")
        .eq("user_id", user!.id)
        .lt("health_score", 50)
        .order("created_at", { ascending: false })
        .limit(20);

      if (scansError) throw scansError;
      setToxicScans((scansData || []) as ScanWithToxins[]);

    } catch (error) {
      console.error("Error loading symptom data:", error);
      toast({
        title: "Error",
        description: "Failed to load symptom history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Combine symptoms from user_symptoms table and legacy leads
  const allSymptoms = [
    // Standalone symptoms from user_symptoms table
    ...userSymptoms.map(s => ({
      symptom: s.symptom,
      category: s.category || "other",
      severity: s.severity || "mild",
      duration: s.duration || "unknown",
      who_affected: s.who_affected || "self",
      leadId: s.id,
      leadDate: s.reported_at,
      products: s.linked_products || [],
      isStandalone: true,
    })),
    // Legacy symptoms from leads
    ...leads.flatMap(lead => 
      (lead.symptoms || []).map(s => ({
        ...s,
        leadId: lead.id,
        leadDate: lead.created_at,
        products: lead.toxic_products_exposure || [],
        isStandalone: false,
      }))
    )
  ].sort((a, b) => new Date(b.leadDate).getTime() - new Date(a.leadDate).getTime());

  // Group symptoms by category
  const symptomsByCategory = allSymptoms.reduce((acc, symptom) => {
    const category = symptom.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(symptom);
    return acc;
  }, {} as Record<string, typeof allSymptoms>);

  // Get unique symptom names with counts
  const symptomCounts = allSymptoms.reduce((acc, s) => {
    acc[s.symptom] = (acc[s.symptom] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get product correlation
  const productSymptomLinks = leads.flatMap(lead => {
    const products = lead.toxic_products_exposure || [];
    const symptoms = lead.symptoms || [];
    return products.map((p: any) => ({
      product: p.product_name,
      brand: p.brand,
      score: p.health_score,
      symptoms: symptoms.map((s: any) => s.symptom),
      date: lead.created_at,
    }));
  });

  const renderTimeline = () => {
    if (allSymptoms.length === 0) {
      return (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Symptoms Logged Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            When you report symptoms during a legal consultation, they'll appear here.
          </p>
          <Link to="/scanner">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Scan a Product
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {leads.filter(l => l.symptoms && l.symptoms.length > 0).map((lead, idx) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {format(new Date(lead.created_at), "MMM d, yyyy")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })})
                    </span>
                  </div>
                  {lead.lead_status && (
                    <Badge variant="outline" className="text-xs">
                      {lead.lead_status}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Symptoms */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Symptoms Reported ({lead.symptoms.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {lead.symptoms.map((symptom, sIdx) => (
                      <Badge 
                        key={sIdx} 
                        variant="outline"
                        className={SEVERITY_COLORS[symptom.severity as keyof typeof SEVERITY_COLORS] || ""}
                      >
                        {CATEGORY_ICONS[symptom.category] || "⚠️"} {symptom.symptom}
                        {symptom.severity === "severe" && " ⚠️"}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Overall severity and duration */}
                <div className="flex gap-4 text-xs">
                  {lead.symptom_severity && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-caution" />
                      <span className="text-muted-foreground">Severity:</span>
                      <span className="font-medium capitalize">{lead.symptom_severity}</span>
                    </div>
                  )}
                  {lead.symptom_duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" />
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{lead.symptom_duration.replace("_", " ")}</span>
                    </div>
                  )}
                </div>

                {/* Linked Products */}
                {lead.toxic_products_exposure && lead.toxic_products_exposure.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Linked Products
                    </p>
                    <div className="space-y-1">
                      {lead.toxic_products_exposure.slice(0, 3).map((product: any, pIdx: number) => (
                        <div key={pIdx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="w-3 h-3 text-danger" />
                            <span>{product.product_name}</span>
                            {product.brand && (
                              <span className="text-xs text-muted-foreground">({product.brand})</span>
                            )}
                          </div>
                          {product.health_score !== undefined && (
                            <Badge 
                              variant="outline" 
                              className={product.health_score < 30 ? "border-danger/50 text-danger" : "border-caution/50 text-caution"}
                            >
                              Score: {product.health_score}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Family affected */}
                {lead.family_affected && lead.family_affected.length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Users className="w-4 h-4 text-pink-400" />
                    <span className="text-xs text-muted-foreground">Family affected:</span>
                    <div className="flex gap-1">
                      {lead.family_affected.map((f: any, fIdx: number) => (
                        <Badge key={fIdx} variant="secondary" className="text-xs">
                          {(f.member || f).replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderCorrelations = () => {
    if (productSymptomLinks.length === 0) {
      return (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Correlations Yet</h3>
          <p className="text-sm text-muted-foreground">
            Link symptoms to scanned products to see patterns.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Product-Symptom Correlations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              These products were linked to reported symptoms. This data strengthens legal cases.
            </p>
            <div className="space-y-3">
              {productSymptomLinks.map((link, idx) => (
                <div key={idx} className="bg-card border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-foreground">{link.product}</p>
                      {link.brand && (
                        <p className="text-xs text-muted-foreground">{link.brand}</p>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={link.score < 30 ? "border-danger/50 text-danger" : "border-caution/50 text-caution"}
                    >
                      Score: {link.score}
                    </Badge>
                  </div>
                  {link.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {link.symptoms.map((s: string, sIdx: number) => (
                        <Badge key={sIdx} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Reported: {format(new Date(link.date), "MMM d, yyyy")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSummary = () => {
    const totalSymptoms = allSymptoms.length;
    const severeCount = allSymptoms.filter(s => s.severity === "severe").length;
    const childrenAffected = allSymptoms.filter(s => 
      s.who_affected?.includes("child") || s.category === "children"
    ).length;

    return (
      <div className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Activity className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{totalSymptoms}</p>
              <p className="text-xs text-muted-foreground">Total Symptoms</p>
            </CardContent>
          </Card>
          <Card className="border-danger/30 bg-danger/5">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-danger mx-auto mb-2" />
              <p className="text-2xl font-bold text-danger">{severeCount}</p>
              <p className="text-xs text-muted-foreground">Severe</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Package className="w-6 h-6 text-caution mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{toxicScans.length}</p>
              <p className="text-xs text-muted-foreground">Toxic Products</p>
            </CardContent>
          </Card>
          <Card className="border-pink-500/30 bg-pink-500/5">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-pink-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-pink-400">{childrenAffected}</p>
              <p className="text-xs text-muted-foreground">Children Affected</p>
            </CardContent>
          </Card>
        </div>

        {/* Most Common Symptoms */}
        {Object.keys(symptomCounts).length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Most Reported Symptoms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(symptomCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([symptom, count], idx) => (
                    <div key={symptom} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{symptom}</span>
                      <Badge variant="secondary">{count}x</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories Breakdown */}
        {Object.keys(symptomsByCategory).length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">By Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(symptomsByCategory).map(([category, symptoms]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{CATEGORY_ICONS[category] || "⚠️"}</span>
                      <span className="text-sm capitalize text-foreground">{category}</span>
                    </div>
                    <Badge variant="outline">{symptoms.length}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legal Case CTA */}
        {totalSymptoms > 0 && (
          <Card className="border-safe/30 bg-safe/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 text-safe shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">Strong Case Evidence</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Your documented symptoms and product exposure create valuable evidence for legal cases.
                    {severeCount > 0 && " Severe symptoms significantly strengthen your case."}
                  </p>
                  <Link to="/history">
                    <Button size="sm" className="gap-2">
                      View Scan History
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <>
    <Helmet>
      <title>Baby Food Reaction Symptom Tracker | Food Allergy & Toxin Symptoms | FoodFactScanner®</title>
      <meta name="description" content="Track your baby's reactions to food ingredients, heavy metals, and toxic baby food products. Log symptoms, identify patterns, and connect reactions to specific baby food brands and ingredients." />
      <meta name="keywords" content="baby food reaction tracker, baby food allergy symptoms, toxic baby food symptoms, baby food ingredient reaction, heavy metals baby symptoms" />
      <link rel="canonical" href="https://foodfactscanner.com/symptoms" />
      <meta property="og:title" content="Baby Food Reaction Symptom Tracker | FoodFactScanner®" />
      <meta property="og:description" content="Track your baby's reactions to food ingredients and identify patterns linked to toxic baby food products." />
      <meta property="og:url" content="https://foodfactscanner.com/symptoms" />
      <meta name="robots" content="index, follow" />
    </Helmet>
    <AppLayout className="bg-background">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Symptom History
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track symptoms and correlate with toxic products
            </p>
          </div>
          <Button 
            onClick={() => setShowRecordModal(true)}
            size="sm"
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Record
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="correlations">Products</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            {renderTimeline()}
          </TabsContent>

          <TabsContent value="correlations">
            {renderCorrelations()}
          </TabsContent>

          <TabsContent value="summary">
            {renderSummary()}
          </TabsContent>
        </Tabs>
      )}

      {/* Record Symptoms Modal */}
      <RecordSymptomsModal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        toxicScans={toxicScans}
        onSymptomsRecorded={loadData}
      />
    </AppLayout>
    </>
  );
}
