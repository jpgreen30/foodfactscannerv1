import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Phone, 
  Mail, 
  Download, 
  Filter, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  User,
  Calendar,
  Send,
  Loader2,
  Settings,
  Webhook
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { LeadDistributionConfig } from "./LeadDistributionConfig";
import { LawFirmAnalyticsTab } from "./LawFirmAnalyticsTab";

interface Lead {
  id: string;
  user_id: string;
  phone_number: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  consent_given: boolean;
  consent_timestamp: string;
  lead_source: string;
  products_scanned: any[];
  health_conditions: any[];
  allergies: any[];
  recalled_products_exposure: any[];
  lead_status: string;
  lead_quality_score: number;
  sold_to_firm: string | null;
  sold_at: string | null;
  notes: string | null;
  created_at: string;
}

export const AdminLeadsTab = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [distributingLeadId, setDistributingLeadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("leads");
  const { toast } = useToast();

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase.rpc("get_admin_leads", {
        _limit: 100,
        _offset: 0,
      });

      if (error) throw error;
      setLeads((data as Lead[]) || []);
    } catch (error) {
      console.error("Error loading leads:", error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("legal_leads")
        .update({ lead_status: newStatus })
        .eq("id", leadId);

      if (error) throw error;

      setLeads(prev => 
        prev.map(lead => 
          lead.id === leadId ? { ...lead, lead_status: newStatus } : lead
        )
      );

      toast({
        title: "Status Updated",
        description: `Lead marked as ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  const distributeLead = async (leadId: string) => {
    setDistributingLeadId(leadId);
    try {
      const { data, error } = await supabase.functions.invoke("distribute-lead", {
        body: { leadId, forceDistribute: true },
      });

      if (error) throw error;

      toast({
        title: "Lead Distributed",
        description: `Sent to ${data.distributed_to}/${data.total_endpoints} endpoints`,
      });

      // Update lead status to "contacted" if it was "new" or "qualified"
      const lead = leads.find(l => l.id === leadId);
      if (lead && (lead.lead_status === "new" || lead.lead_status === "qualified")) {
        await updateLeadStatus(leadId, "contacted");
      }
    } catch (error: any) {
      console.error("Error distributing lead:", error);
      toast({
        title: "Distribution Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDistributingLeadId(null);
    }
  };

  const exportLeads = (format: "csv" | "json") => {
    const filteredLeads = leads.filter(lead => {
      if (statusFilter !== "all" && lead.lead_status !== statusFilter) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          lead.phone_number?.toLowerCase().includes(search) ||
          lead.email?.toLowerCase().includes(search) ||
          lead.first_name?.toLowerCase().includes(search) ||
          lead.last_name?.toLowerCase().includes(search)
        );
      }
      return true;
    });

    if (format === "csv") {
      const headers = [
        "ID",
        "Phone",
        "Email",
        "First Name",
        "Last Name",
        "Status",
        "Quality Score",
        "Consent Given",
        "Consent Date",
        "Products Scanned",
        "Health Conditions",
        "Recalled Exposure",
        "Created At"
      ];
      
      const csvContent = [
        headers.join(","),
        ...filteredLeads.map(lead => [
          lead.id,
          lead.phone_number,
          lead.email || "",
          lead.first_name || "",
          lead.last_name || "",
          lead.lead_status,
          lead.lead_quality_score,
          lead.consent_given,
          lead.consent_timestamp,
          JSON.stringify(lead.products_scanned),
          JSON.stringify(lead.health_conditions),
          JSON.stringify(lead.recalled_products_exposure),
          lead.created_at
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `legal_leads_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    } else {
      const blob = new Blob([JSON.stringify(filteredLeads, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `legal_leads_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
    }

    toast({
      title: "Export Complete",
      description: `Exported ${filteredLeads.length} leads as ${format.toUpperCase()}`,
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      new: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
      qualified: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: AlertTriangle },
      contacted: { color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Phone },
      sold: { color: "bg-green-500/20 text-green-400 border-green-500/30", icon: DollarSign },
      rejected: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
    };
    const { color, icon: Icon } = config[status] || config.new;
    return (
      <Badge variant="outline" className={`${color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredLeads = leads.filter(lead => {
    if (statusFilter !== "all" && lead.lead_status !== statusFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        lead.phone_number?.toLowerCase().includes(search) ||
        lead.email?.toLowerCase().includes(search) ||
        lead.first_name?.toLowerCase().includes(search) ||
        lead.last_name?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.lead_status === "new").length,
    qualified: leads.filter(l => l.lead_status === "qualified").length,
    sold: leads.filter(l => l.lead_status === "sold").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs for Leads vs Law Firms vs Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="leads" className="gap-2">
            <User className="w-4 h-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="law-firms" className="gap-2">
            <Webhook className="w-4 h-4" />
            Law Firms
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="law-firms" className="mt-6">
          <LeadDistributionConfig />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <LawFirmAnalyticsTab />
        </TabsContent>

        <TabsContent value="leads" className="mt-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Total Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  New
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-400">{stats.new}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Qualified
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-400">{stats.qualified}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Sold
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-400">{stats.sold}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Export */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportLeads("csv")}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportLeads("json")}>
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>

          {/* Leads Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Consent</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {lead.phone_number}
                            </div>
                            {lead.email && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                {lead.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.first_name || lead.last_name 
                            ? `${lead.first_name || ""} ${lead.last_name || ""}`.trim()
                            : <span className="text-muted-foreground">—</span>
                          }
                        </TableCell>
                        <TableCell>{getStatusBadge(lead.lead_status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              lead.lead_quality_score >= 70 ? "bg-green-500" :
                              lead.lead_quality_score >= 40 ? "bg-yellow-500" : "bg-red-500"
                            }`} />
                            {lead.lead_quality_score}
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.consent_given ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(lead.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => distributeLead(lead.id)}
                              disabled={distributingLeadId === lead.id}
                              title="Distribute to law firms"
                            >
                              {distributingLeadId === lead.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </Button>
                            <Select
                              value={lead.lead_status}
                              onValueChange={(value) => updateLeadStatus(lead.id, value)}
                            >
                              <SelectTrigger className="w-[100px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="sold">Sold</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
