import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Send, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  FileText,
  MessageSquare,
  Settings,
  Eye,
  Phone,
  UserPlus
} from "lucide-react";

const EMAIL_TEMPLATES = [
  { id: "welcome", name: "Welcome Email", description: "Sent to new users after registration", icon: "🎉" },
  { id: "forgot_password", name: "Forgot Password", description: "Password reset link", icon: "🔐" },
  { id: "password_reset_confirm", name: "Password Changed", description: "Confirmation after password change", icon: "✅" },
  { id: "email_verification", name: "Email Verification", description: "Verify email address", icon: "📧" },
  { id: "account_deleted", name: "Account Deleted", description: "Confirmation of account deletion", icon: "👋" },
  { id: "weekly_report", name: "Weekly Report", description: "Weekly health summary", icon: "📊" },
  { id: "recall_alert", name: "Recall Alert", description: "FDA recall notifications", icon: "🚨" },
  { id: "custom", name: "Custom Email", description: "Send a custom message", icon: "✉️" },
];

interface RegistrationLog {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  ip_address: string | null;
  registered_at: string;
  admin_notified: boolean;
  signup_source: string | null;
  geo_location: unknown;
}

export const EmailManagementTab = () => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testSmsMessage, setTestSmsMessage] = useState("This is a test SMS from FoodWise.");
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [bulkEmailType, setBulkEmailType] = useState("all_users");
  const [registrationLogs, setRegistrationLogs] = useState<RegistrationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  // Template data for preview
  const [templateData, setTemplateData] = useState({
    name: "John",
    productName: "Organic Baby Food",
    brand: "SafeBaby Co",
    reason: "Potential contamination",
    action: "Return to store for full refund",
    scansCount: "15",
    safeProducts: "12",
    warningsCount: "3",
    streakDays: "7",
  });

  // Load registration logs
  useEffect(() => {
    loadRegistrationLogs();
  }, []);

  const loadRegistrationLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from("user_registrations")
        .select("*")
        .order("registered_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setRegistrationLogs(data || []);
    } catch (error) {
      console.error("Error loading registration logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const sendTestSms = async () => {
    if (!testPhone) {
      toast({
        title: "Missing Phone Number",
        description: "Please enter a phone number to send the test SMS.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingSms(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: {
          to: testPhone,
          message: testSmsMessage,
        },
      });

      if (error) throw error;

      toast({
        title: "SMS Sent! 📱",
        description: `Test SMS sent successfully to ${testPhone}`,
      });
    } catch (error: any) {
      console.error("Error sending test SMS:", error);
      toast({
        title: "Failed to Send SMS",
        description: error.message || "Could not send test SMS. Check Twilio configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSendingSms(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !selectedTemplate) {
      toast({
        title: "Missing Information",
        description: "Please enter an email address and select a template.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const payload: Record<string, any> = {
        type: selectedTemplate,
        to: testEmail,
        toName: templateData.name,
        templateData: {
          ...templateData,
          baseUrl: window.location.origin,
        },
      };

      if (selectedTemplate === "custom") {
        payload.subject = customSubject;
        payload.templateData.message = customMessage;
      }

      const { data, error } = await supabase.functions.invoke("sendgrid-email", {
        body: payload,
      });

      if (error) throw error;

      toast({
        title: "Email Sent! ✉️",
        description: `Test email sent successfully to ${testEmail}`,
      });
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send test email",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const sendBulkEmails = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Select Template",
        description: "Please select an email template first.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingBulk(true);
    try {
      // Get users based on filter
      let query = supabase.from("profiles").select("id, email, first_name, display_name");
      
      if (bulkEmailType === "premium_users") {
        query = query.eq("subscription_tier", "premium");
      } else if (bulkEmailType === "free_users") {
        query = query.or("subscription_tier.is.null,subscription_tier.eq.free");
      } else if (bulkEmailType === "with_phone") {
        query = query.not("phone_number", "is", null);
      }

      const { data: users, error: usersError } = await query;
      
      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        toast({
          title: "No Users Found",
          description: "No users match the selected criteria.",
          variant: "destructive",
        });
        return;
      }

      // Filter users with valid emails
      const validUsers = users.filter(u => u.email);
      
      let successCount = 0;
      let failCount = 0;

      // Send emails in batches of 10
      for (let i = 0; i < validUsers.length; i += 10) {
        const batch = validUsers.slice(i, i + 10);
        
        await Promise.all(batch.map(async (user) => {
          try {
            const payload: Record<string, any> = {
              type: selectedTemplate,
              to: user.email,
              toName: user.first_name || user.display_name || "there",
              templateData: {
                ...templateData,
                name: user.first_name || user.display_name || "there",
                userId: user.id,
                baseUrl: window.location.origin,
              },
            };

            if (selectedTemplate === "custom") {
              payload.subject = customSubject;
              payload.templateData.message = customMessage;
            }

            const { error } = await supabase.functions.invoke("sendgrid-email", {
              body: payload,
            });

            if (error) throw error;
            successCount++;
          } catch (err) {
            console.error(`Failed to send to ${user.email}:`, err);
            failCount++;
          }
        }));
      }

      toast({
        title: "Bulk Email Complete",
        description: `Sent: ${successCount}, Failed: ${failCount}`,
        variant: failCount > 0 ? "destructive" : "default",
      });
    } catch (error: any) {
      console.error("Bulk email error:", error);
      toast({
        title: "Bulk Email Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSendingBulk(false);
    }
  };

  const selectedTemplateInfo = EMAIL_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Mail className="w-5 h-5 text-primary" />
              Email Management (SendGrid)
            </CardTitle>
            <CardDescription>
              Send transactional emails to users using SendGrid
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="templates" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="templates" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="test" className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Test Email
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Bulk Send
                </TabsTrigger>
                <TabsTrigger value="sms" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  SMS
                </TabsTrigger>
                <TabsTrigger value="registrations" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Registrations
                </TabsTrigger>
              </TabsList>

              {/* Templates Tab */}
              <TabsContent value="templates" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {EMAIL_TEMPLATES.map((template) => (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate === template.id 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          </div>
                          {selectedTemplate === template.id && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedTemplateInfo && (
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Selected Template: {selectedTemplateInfo.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {selectedTemplateInfo.icon} {selectedTemplateInfo.description}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Test Email Tab */}
              <TabsContent value="test" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Select Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose email template" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMAIL_TEMPLATES.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.icon} {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Recipient Email</Label>
                    <Input
                      type="email"
                      placeholder="test@example.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Recipient Name (for template)</Label>
                    <Input
                      placeholder="John Doe"
                      value={templateData.name}
                      onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                    />
                  </div>

                  {selectedTemplate === "custom" && (
                    <>
                      <div className="grid gap-2">
                        <Label>Custom Subject</Label>
                        <Input
                          placeholder="Email subject..."
                          value={customSubject}
                          onChange={(e) => setCustomSubject(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Custom Message (HTML supported)</Label>
                        <Textarea
                          placeholder="<p>Your message here...</p>"
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          rows={5}
                        />
                      </div>
                    </>
                  )}

                  {(selectedTemplate === "recall_alert") && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Product Name</Label>
                        <Input
                          value={templateData.productName}
                          onChange={(e) => setTemplateData({ ...templateData, productName: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Brand</Label>
                        <Input
                          value={templateData.brand}
                          onChange={(e) => setTemplateData({ ...templateData, brand: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2 col-span-2">
                        <Label>Recall Reason</Label>
                        <Input
                          value={templateData.reason}
                          onChange={(e) => setTemplateData({ ...templateData, reason: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2 col-span-2">
                        <Label>Recommended Action</Label>
                        <Input
                          value={templateData.action}
                          onChange={(e) => setTemplateData({ ...templateData, action: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={sendTestEmail} 
                    disabled={isSending || !selectedTemplate || !testEmail}
                    className="w-full"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Test Email
                  </Button>
                </div>
              </TabsContent>

              {/* Bulk Send Tab */}
              <TabsContent value="bulk" className="space-y-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-destructive">Caution: Bulk Email</h4>
                    <p className="text-sm text-muted-foreground">
                      This will send emails to multiple users. Make sure you've tested the template first.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Select Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose email template" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMAIL_TEMPLATES.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.icon} {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Target Audience</Label>
                    <Select value={bulkEmailType} onValueChange={setBulkEmailType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_users">All Users with Email</SelectItem>
                        <SelectItem value="premium_users">Premium Subscribers Only</SelectItem>
                        <SelectItem value="free_users">Free Users Only</SelectItem>
                        <SelectItem value="with_phone">Users with Phone Number</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplate === "custom" && (
                    <>
                      <div className="grid gap-2">
                        <Label>Custom Subject</Label>
                        <Input
                          placeholder="Email subject..."
                          value={customSubject}
                          onChange={(e) => setCustomSubject(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Custom Message (HTML supported)</Label>
                        <Textarea
                          placeholder="<p>Your message here...</p>"
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          rows={5}
                        />
                      </div>
                    </>
                  )}

                  <Button 
                    onClick={sendBulkEmails} 
                    disabled={isSendingBulk || !selectedTemplate}
                    variant="destructive"
                    className="w-full"
                  >
                    {isSendingBulk ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Users className="w-4 h-4 mr-2" />
                    )}
                    Send Bulk Emails
                  </Button>
                </div>
              </TabsContent>
              {/* SMS Tab */}
              <TabsContent value="sms" className="space-y-4">
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Twilio SMS Integration
                    </CardTitle>
                    <CardDescription>
                      Send SMS notifications for recalls and alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Twilio Connected</h4>
                          <p className="text-sm text-muted-foreground">SMS sending is configured</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-safe/10 text-safe border-safe/20">
                        Active
                      </Badge>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Test Phone Number</Label>
                        <Input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={testPhone}
                          onChange={(e) => setTestPhone(e.target.value)}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Test Message</Label>
                        <Textarea
                          placeholder="Your SMS message..."
                          value={testSmsMessage}
                          onChange={(e) => setTestSmsMessage(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <Button 
                        onClick={sendTestSms} 
                        disabled={isSendingSms || !testPhone}
                        className="w-full"
                      >
                        {isSendingSms ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <MessageSquare className="w-4 h-4 mr-2" />
                        )}
                        Send Test SMS
                      </Button>
                    </div>

                    <div className="mt-6 pt-4 border-t">
                      <h4 className="font-semibold text-foreground mb-2">SMS Features</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✓ FDA Recall Alerts to opted-in users</li>
                        <li>✓ Toxic product warnings</li>
                        <li>✓ Delivery status logging</li>
                        <li>✓ Phone number formatting</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Registrations Tab */}
              <TabsContent value="registrations" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Recent User Registrations</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadRegistrationLogs}
                    disabled={loadingLogs}
                  >
                    {loadingLogs ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                  </Button>
                </div>

                {registrationLogs.length === 0 ? (
                  <Card className="bg-muted/50">
                    <CardContent className="py-8 text-center">
                      <UserPlus className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground">No registration logs yet</p>
                      <p className="text-sm text-muted-foreground">New signups will appear here with IP addresses</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {registrationLogs.map((log) => (
                      <Card key={log.id} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-foreground">
                                  {log.first_name || log.last_name 
                                    ? `${log.first_name || ""} ${log.last_name || ""}`.trim()
                                    : "Unknown"}
                                </span>
                                {log.admin_notified && (
                                  <Badge variant="outline" className="text-xs bg-safe/10 text-safe">
                                    Notified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{log.email}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                                <span>🌐 {log.ip_address || "Unknown IP"}</span>
                                <span>📍 {
                                  log.geo_location && typeof log.geo_location === 'object' && 'city' in log.geo_location
                                    ? `${(log.geo_location as Record<string, string>).city || ''}, ${(log.geo_location as Record<string, string>).country || ''}`
                                    : "Unknown location"
                                }</span>
                                <span>📲 {log.signup_source || "web_app"}</span>
                              </div>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              {new Date(log.registered_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Email Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Settings className="w-5 h-5 text-primary" />
              SendGrid Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">SendGrid API Connected</h4>
                  <p className="text-sm text-muted-foreground">API key is configured and ready</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-safe/10 text-safe border-safe/20">
                Active
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-foreground">8</p>
                <p className="text-xs text-muted-foreground">Email Templates</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-foreground">✓</p>
                <p className="text-xs text-muted-foreground">Click Tracking</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-foreground">✓</p>
                <p className="text-xs text-muted-foreground">Open Tracking</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-foreground">✓</p>
                <p className="text-xs text-muted-foreground">HTML Support</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
