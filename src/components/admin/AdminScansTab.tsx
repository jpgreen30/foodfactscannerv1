import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ScanLine, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface AdminScan {
  id: string;
  user_email: string;
  user_name: string;
  product_name: string;
  brand: string;
  health_score: number;
  verdict: string;
  scan_type: string;
  created_at: string;
}

export const AdminScansTab = () => {
  const { toast } = useToast();
  const [scans, setScans] = useState<AdminScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    loadScans();
  }, [page]);

  const loadScans = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_admin_scans", {
        _limit: pageSize,
        _offset: page * pageSize,
      });
      if (error) throw error;
      setScans(data || []);
    } catch (err) {
      console.error("Error loading scans:", err);
      toast({
        title: "Error",
        description: "Could not load scans. Make sure you have admin access.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getVerdictBadge = (verdict: string) => {
    if (!verdict) return "bg-muted text-muted-foreground";
    const lower = verdict.toLowerCase();
    if (lower.includes("safe") || lower.includes("healthy")) return "bg-safe/20 text-safe";
    if (lower.includes("avoid") || lower.includes("unhealthy")) return "bg-danger/20 text-danger";
    return "bg-caution/20 text-caution";
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 70) return "text-safe";
    if (score >= 40) return "text-caution";
    return "text-danger";
  };

  if (isLoading && scans.length === 0) {
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            Scan Activity
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0 || isLoading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Page {page + 1}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={scans.length < pageSize || isLoading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{scan.product_name}</p>
                        <p className="text-xs text-muted-foreground">{scan.brand || "—"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{scan.user_name}</p>
                        <p className="text-xs text-muted-foreground">{scan.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${getScoreColor(scan.health_score)}`}>
                        {scan.health_score !== null ? scan.health_score : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getVerdictBadge(scan.verdict)}>
                        {scan.verdict || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground capitalize">
                        {scan.scan_type || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(scan.created_at), "MMM d, h:mm a")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {scans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No scans found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
