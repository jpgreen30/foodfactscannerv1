import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  History, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";

interface WebhookLog {
  event: string;
  timestamp: string;
  status: number;
  success: boolean;
}

export const WebhookLogViewer = () => {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Get the last webhook call from app_settings
      const { data } = await supabase
        .from("app_settings")
        .select("key, value, updated_at")
        .eq("key", "zapier_last_webhook_call")
        .single();

      if (data?.value) {
        try {
          const lastCall = JSON.parse(data.value);
          setLogs([lastCall]);
        } catch {
          setLogs([]);
        }
      }
    } catch (error) {
      console.error("Error loading webhook logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Webhook Activity
            </CardTitle>
            <CardDescription>
              Recent webhook calls and their status
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No webhook activity yet</p>
            <p className="text-xs mt-1">Webhook calls will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedLog(expandedLog === index ? null : index)}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {log.success ? (
                        <CheckCircle2 className="w-4 h-4 text-safe" />
                      ) : (
                        <XCircle className="w-4 h-4 text-danger" />
                      )}
                      <div className="text-left">
                        <span className="font-medium text-sm">{log.event}</span>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={log.success ? "secondary" : "destructive"}>
                        {log.status}
                      </Badge>
                      {expandedLog === index ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                  
                  {expandedLog === index && (
                    <div className="border-t bg-muted/30 p-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Event:</span>
                          <span className="ml-2 font-medium">{log.event}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <span className="ml-2 font-medium">{log.status}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Timestamp:</span>
                          <span className="ml-2 font-medium">
                            {new Date(log.timestamp).toISOString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
