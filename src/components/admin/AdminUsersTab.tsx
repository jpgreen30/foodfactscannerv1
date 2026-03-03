import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, ChevronDown, ChevronUp, ScanLine } from "lucide-react";
import { format } from "date-fns";

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  subscription_tier: string;
  created_at: string;
  scan_count: number;
}

interface UserScan {
  id: string;
  product_name: string;
  brand: string;
  health_score: number;
  verdict: string;
  created_at: string;
}

export const AdminUsersTab = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userScans, setUserScans] = useState<Record<string, UserScan[]>>({});
  const [loadingScans, setLoadingScans] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_admin_users");
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Error loading users:", err);
      toast({
        title: "Error",
        description: "Could not load users. Make sure you have admin access.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserScans = async (userId: string) => {
    if (userScans[userId]) {
      setExpandedUser(expandedUser === userId ? null : userId);
      return;
    }

    setLoadingScans(userId);
    try {
      const { data, error } = await supabase
        .from("scan_history")
        .select("id, product_name, brand, health_score, verdict, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setUserScans((prev) => ({ ...prev, [userId]: data || [] }));
      setExpandedUser(userId);
    } catch (err) {
      console.error("Error loading user scans:", err);
    } finally {
      setLoadingScans(null);
    }
  };

  const getTierBadge = (tier: string) => {
    const tierColors: Record<string, string> = {
      free: "bg-muted text-muted-foreground",
      premium: "bg-primary/20 text-primary",
      family: "bg-safe/20 text-safe",
      pro: "bg-yellow-500/20 text-yellow-500",
    };
    return tierColors[tier] || tierColors.free;
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict?.toLowerCase().includes("safe")) return "text-safe";
    if (verdict?.toLowerCase().includes("avoid") || verdict?.toLowerCase().includes("caution")) return "text-danger";
    return "text-caution";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            All Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Scans</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <>
                    <TableRow 
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => loadUserScans(user.id)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.display_name || user.first_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {user.phone_number || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTierBadge(user.subscription_tier)}>
                          {user.subscription_tier || "free"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{user.scan_count}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(user.created_at), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {loadingScans === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : expandedUser === user.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedUser === user.id && userScans[user.id] && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <ScanLine className="w-4 h-4" />
                              Recent Scans
                            </h4>
                            {userScans[user.id].length === 0 ? (
                              <p className="text-sm text-muted-foreground">No scans yet</p>
                            ) : (
                              <div className="grid gap-2">
                                {userScans[user.id].map((scan) => (
                                  <div
                                    key={scan.id}
                                    className="flex items-center justify-between p-2 rounded bg-background border"
                                  >
                                    <div>
                                      <p className="font-medium text-sm">{scan.product_name}</p>
                                      <p className="text-xs text-muted-foreground">{scan.brand}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className={`text-sm font-medium ${getVerdictColor(scan.verdict)}`}>
                                        {scan.health_score ? `${scan.health_score}/100` : "—"}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {format(new Date(scan.created_at), "MMM d, h:mm a")}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
