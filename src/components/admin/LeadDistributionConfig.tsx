import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Webhook,
  Mail,
  Zap,
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Scale,
  Building,
  MapPin,
  Star,
  DollarSign,
} from "lucide-react";

interface LawFirmEndpoint {
  id: string;
  name: string;
  endpoint_type: string;
  url?: string;
  email?: string;
  api_key?: string;
  is_active: boolean;
  filters?: {
    min_quality_score?: number;
    practice_area?: string;
    contact_person?: string;
    location?: string;
  };
  success_count: number;
  failure_count: number;
  last_triggered_at?: string;
  price_per_lead?: number;
  monthly_cap?: number;
  current_month_count?: number;
  billing_email?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  distribution_priority?: number;
  exclusive_leads?: boolean;
  total_revenue?: number;
}

export const LeadDistributionConfig = () => {
  const { toast } = useToast();
  const [endpoints, setEndpoints] = useState<LawFirmEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const [newEndpoint, setNewEndpoint] = useState({
    name: "",
    endpoint_type: "webhook",
    url: "",
    email: "",
    api_key: "",
    is_active: true,
    contact_person: "",
    practice_area: "",
    location: "",
    min_quality_score: 0,
    price_per_lead: 0,
    monthly_cap: "",
    billing_email: "",
    distribution_priority: 1,
    exclusive_leads: false,
  });

  useEffect(() => {
    loadEndpoints();
  }, []);

  const loadEndpoints = async () => {
    try {
      const { data, error } = await supabase
        .from("webhook_endpoints")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEndpoints((data || []) as unknown as LawFirmEndpoint[]);
    } catch (error) {
      console.error("Error loading endpoints:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEndpoint = async () => {
    if (!newEndpoint.name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    if (newEndpoint.endpoint_type === "email" && !newEndpoint.email) {
      toast({ title: "Email required for email endpoints", variant: "destructive" });
      return;
    }

    if (newEndpoint.endpoint_type !== "email" && !newEndpoint.url) {
      toast({ title: "URL required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const filters = {
        min_quality_score: newEndpoint.min_quality_score || 0,
        practice_area: newEndpoint.practice_area || null,
        contact_person: newEndpoint.contact_person || null,
        location: newEndpoint.location || null,
      };

      const { error } = await supabase.from("webhook_endpoints").insert({
        name: newEndpoint.name,
        endpoint_type: newEndpoint.endpoint_type,
        url: newEndpoint.endpoint_type !== "email" ? newEndpoint.url : null,
        email: newEndpoint.endpoint_type === "email" ? newEndpoint.email : null,
        api_key: newEndpoint.api_key || null,
        is_active: newEndpoint.is_active,
        filters,
        price_per_lead: newEndpoint.price_per_lead || 0,
        monthly_cap: newEndpoint.monthly_cap ? parseInt(newEndpoint.monthly_cap) : null,
        billing_email: newEndpoint.billing_email || null,
        distribution_priority: newEndpoint.distribution_priority || 1,
        exclusive_leads: newEndpoint.exclusive_leads || false,
      } as any);

      if (error) throw error;

      toast({ title: "Law firm added successfully" });
      setNewEndpoint({
        name: "",
        endpoint_type: "webhook",
        url: "",
        email: "",
        api_key: "",
        is_active: true,
        contact_person: "",
        practice_area: "",
        location: "",
        min_quality_score: 0,
        price_per_lead: 0,
        monthly_cap: "",
        billing_email: "",
        distribution_priority: 1,
        exclusive_leads: false,
      });
      setShowAddForm(false);
      loadEndpoints();
    } catch (error: any) {
      toast({ title: "Error adding endpoint", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("webhook_endpoints")
        .update({ is_active: isActive } as any)
        .eq("id", id);

      if (error) throw error;
      setEndpoints(endpoints.map(e => e.id === id ? { ...e, is_active: isActive } : e));
    } catch (error: any) {
      toast({ title: "Error updating endpoint", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this endpoint?")) return;

    try {
      const { error } = await supabase.from("webhook_endpoints").delete().eq("id", id);
      if (error) throw error;
      setEndpoints(endpoints.filter(e => e.id !== id));
      toast({ title: "Endpoint deleted" });
    } catch (error: any) {
      toast({ title: "Error deleting endpoint", variant: "destructive" });
    }
  };

  const handleTestEndpoint = async (endpoint: LawFirmEndpoint) => {
    setTestingId(endpoint.id);
    try {
      // Create a test payload
      const testPayload = {
        lead_id: "test-lead-id",
        contact: {
          first_name: "Test",
          last_name: "Lead",
          phone: "(555) 123-4567",
          email: "test@example.com",
        },
        consent: { given: true, timestamp: new Date().toISOString() },
        exposure: { toxic_products: [], injury_description: "Test injury" },
        quality: { score: 75, source: "test" },
        timestamp: new Date().toISOString(),
      };

      if (endpoint.endpoint_type === "email") {
        toast({ title: "Email test not available", description: "Use a real lead to test email delivery" });
      } else if (endpoint.url) {
        const response = await fetch(endpoint.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          mode: "no-cors",
          body: JSON.stringify(testPayload),
        });

        toast({
          title: "Test Request Sent",
          description: "Check the endpoint's logs to verify receipt",
        });
      }
    } catch (error: any) {
      toast({ title: "Test failed", description: error.message, variant: "destructive" });
    } finally {
      setTestingId(null);
    }
  };

  const getEndpointIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="w-4 h-4" />;
      case "zapier": return <Zap className="w-4 h-4" />;
      case "api": return <Globe className="w-4 h-4" />;
      default: return <Webhook className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Law Firm Endpoints
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure law firms to receive qualified leads automatically
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Law Firm
        </Button>
      </div>

      {/* Add Law Firm Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="w-4 h-4" />
                Add New Law Firm
              </CardTitle>
              <CardDescription>Configure a new law firm endpoint to receive leads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Row 1: Name and Integration Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Law Firm Name *</Label>
                  <Input
                    placeholder="e.g., Smith & Associates Law Firm"
                    value={newEndpoint.name}
                    onChange={(e) => setNewEndpoint({ ...newEndpoint, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Integration Type</Label>
                  <Select
                    value={newEndpoint.endpoint_type}
                    onValueChange={(value) => setNewEndpoint({ ...newEndpoint, endpoint_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="zapier">Zapier</SelectItem>
                      <SelectItem value="api">REST API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Contact Person and Practice Area */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input
                    placeholder="e.g., John Smith (Intake Manager)"
                    value={newEndpoint.contact_person}
                    onChange={(e) => setNewEndpoint({ ...newEndpoint, contact_person: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Practice Area / Specialty</Label>
                  <Select
                    value={newEndpoint.practice_area}
                    onValueChange={(value) => setNewEndpoint({ ...newEndpoint, practice_area: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select practice area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product_liability">Product Liability</SelectItem>
                      <SelectItem value="personal_injury">Personal Injury</SelectItem>
                      <SelectItem value="mass_tort">Mass Tort</SelectItem>
                      <SelectItem value="toxic_exposure">Toxic Exposure</SelectItem>
                      <SelectItem value="class_action">Class Action</SelectItem>
                      <SelectItem value="general">General Practice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Location and Min Quality Score */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location / State</Label>
                  <Input
                    placeholder="e.g., California, TX, Nationwide"
                    value={newEndpoint.location}
                    onChange={(e) => setNewEndpoint({ ...newEndpoint, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min. Lead Quality Score</Label>
                  <Select
                    value={newEndpoint.min_quality_score.toString()}
                    onValueChange={(value) => setNewEndpoint({ ...newEndpoint, min_quality_score: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Leads (0+)</SelectItem>
                      <SelectItem value="30">30+ (Low Quality+)</SelectItem>
                      <SelectItem value="50">50+ (Medium Quality+)</SelectItem>
                      <SelectItem value="70">70+ (High Quality Only)</SelectItem>
                      <SelectItem value="85">85+ (Premium Only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Connection Details */}
              {newEndpoint.endpoint_type === "email" ? (
                <div className="space-y-2">
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="leads@lawfirm.com"
                    value={newEndpoint.email}
                    onChange={(e) => setNewEndpoint({ ...newEndpoint, email: e.target.value })}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Webhook/API URL *</Label>
                    <Input
                      placeholder="https://hooks.zapier.com/... or https://api.lawfirm.com/leads"
                      value={newEndpoint.url}
                      onChange={(e) => setNewEndpoint({ ...newEndpoint, url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Key / Auth Header (Optional)</Label>
                    <Input
                      type="password"
                      placeholder="Bearer token or API key for authentication"
                      value={newEndpoint.api_key}
                      onChange={(e) => setNewEndpoint({ ...newEndpoint, api_key: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Pricing & Billing Section */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Pricing & Billing
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Price Per Lead ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="50.00"
                      value={newEndpoint.price_per_lead || ""}
                      onChange={(e) => setNewEndpoint({ ...newEndpoint, price_per_lead: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly Cap</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Unlimited"
                      value={newEndpoint.monthly_cap}
                      onChange={(e) => setNewEndpoint({ ...newEndpoint, monthly_cap: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Email</Label>
                    <Input
                      type="email"
                      placeholder="billing@lawfirm.com"
                      value={newEndpoint.billing_email}
                      onChange={(e) => setNewEndpoint({ ...newEndpoint, billing_email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label>Distribution Priority (1 = highest)</Label>
                    <Select
                      value={newEndpoint.distribution_priority.toString()}
                      onValueChange={(value) => setNewEndpoint({ ...newEndpoint, distribution_priority: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Premium</SelectItem>
                        <SelectItem value="2">2 - Standard</SelectItem>
                        <SelectItem value="3">3 - Economy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <Switch
                      checked={newEndpoint.exclusive_leads}
                      onCheckedChange={(checked) => setNewEndpoint({ ...newEndpoint, exclusive_leads: checked })}
                    />
                    <Label>Exclusive leads only</Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={newEndpoint.is_active}
                  onCheckedChange={(checked) => setNewEndpoint({ ...newEndpoint, is_active: checked })}
                />
                <Label>Active immediately</Label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEndpoint} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add Law Firm
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Endpoints List */}
      <div className="space-y-3">
        {endpoints.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Scale className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No law firms configured yet.</p>
              <p className="text-sm">Add a law firm to start receiving leads automatically.</p>
            </CardContent>
          </Card>
        ) : (
          endpoints.map((endpoint) => (
            <Card key={endpoint.id} className={`${!endpoint.is_active ? "opacity-60" : ""} border-l-4 ${endpoint.is_active ? "border-l-primary" : "border-l-muted"}`}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Icon & Name */}
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {getEndpointIcon(endpoint.endpoint_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{endpoint.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {endpoint.endpoint_type}
                      </Badge>
                      {endpoint.filters?.min_quality_score > 0 && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Star className="w-3 h-3" />
                          {endpoint.filters.min_quality_score}+
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {endpoint.email || endpoint.url}
                    </p>
                    {/* Additional Info Row */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {endpoint.filters?.practice_area && (
                        <span className="flex items-center gap-1">
                          <Scale className="w-3 h-3" />
                          {endpoint.filters.practice_area.replace("_", " ")}
                        </span>
                      )}
                      {endpoint.filters?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {endpoint.filters.location}
                        </span>
                      )}
                      {endpoint.filters?.contact_person && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {endpoint.filters.contact_person}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex flex-col items-end gap-1 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium">{endpoint.success_count}</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        <span className="font-medium">{endpoint.failure_count}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">leads sent</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={endpoint.is_active}
                      onCheckedChange={(checked) => handleToggleActive(endpoint.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTestEndpoint(endpoint)}
                      disabled={testingId === endpoint.id}
                      title="Send test lead"
                    >
                      {testingId === endpoint.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(endpoint.id)}
                      className="text-destructive hover:text-destructive"
                      title="Delete law firm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
