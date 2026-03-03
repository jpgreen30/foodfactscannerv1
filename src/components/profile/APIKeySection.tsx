import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Key,
  Copy,
  Trash2,
  Plus,
  Check,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

// Generate a random API key
const generateApiKey = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "ss_live_";
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};

// Hash the API key for storage
const hashApiKey = async (key: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
};

export const APIKeySection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, key_prefix, is_active, created_at, last_used_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error("Error fetching API keys:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your API key",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const newKey = generateApiKey();
      const keyHash = await hashApiKey(newKey);
      const keyPrefix = newKey.substring(0, 12) + "...";

      const { error } = await supabase.from("api_keys").insert({
        user_id: user!.id,
        name: newKeyName.trim(),
        key_hash: keyHash,
        key_prefix: keyPrefix,
      });

      if (error) throw error;

      setNewlyCreatedKey(newKey);
      setShowCreateForm(false);
      setNewKeyName("");
      fetchApiKeys();

      toast({
        title: "API Key Created",
        description: "Make sure to copy your key now - you won't be able to see it again!",
      });
    } catch (error: any) {
      console.error("Error creating API key:", error);
      toast({
        title: "Error",
        description: error.message || "Could not create API key",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", keyId);

      if (error) throw error;

      setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
      toast({
        title: "API Key Deleted",
        description: "The API key has been revoked",
      });
    } catch (error: any) {
      console.error("Error deleting API key:", error);
      toast({
        title: "Error",
        description: error.message || "Could not delete API key",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Newly Created Key Alert */}
      {newlyCreatedKey && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-caution/10 rounded-xl border-2 border-caution"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-caution" />
            <span className="font-bold text-foreground">Copy Your API Key Now!</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            This is the only time you'll see this key. Store it securely.
          </p>
          <div className="flex gap-2">
            <Input
              value={newlyCreatedKey}
              readOnly
              className="font-mono text-sm bg-muted/50 border-border text-foreground"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(newlyCreatedKey, "new")}
              className="border-caution text-caution hover:bg-caution/20"
            >
              {copiedId === "new" ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNewlyCreatedKey(null)}
            className="mt-2 text-muted-foreground"
          >
            I've saved my key
          </Button>
        </motion.div>
      )}

      {/* Create Key Form */}
      {showCreateForm ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-muted/50 rounded-xl border border-border"
        >
          <h3 className="font-medium text-foreground mb-3">Create New API Key</h3>
          <div className="flex gap-2">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g., Production, Testing)"
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
            />
            <Button
              onClick={handleCreateKey}
              disabled={isCreating}
              className="bg-primary hover:bg-primary/90"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateForm(false);
                setNewKeyName("");
              }}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      ) : (
        <Button
          onClick={() => setShowCreateForm(true)}
          variant="outline"
          className="w-full border-primary/30 text-primary hover:bg-primary/10"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New API Key
        </Button>
      )}

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No API keys yet</p>
          <p className="text-sm">Create one to start using the API</p>
        </div>
      ) : (
        <div className="space-y-2">
          {apiKeys.map((key) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-muted/50 rounded-xl border border-border flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">{key.name}</span>
                  {key.is_active ? (
                    <Badge className="bg-safe/20 text-safe text-xs">Active</Badge>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground text-xs">Inactive</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-mono">{key.key_prefix}</span>
                  <span>•</span>
                  <span>
                    {key.last_used_at
                      ? `Last used ${new Date(key.last_used_at).toLocaleDateString()}`
                      : "Never used"}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteKey(key.id)}
                className="text-danger/70 hover:text-danger hover:bg-danger/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* API Documentation Link */}
      <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
        <h3 className="font-medium text-foreground mb-2">API Documentation</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Use your API key to access your scan data programmatically.
        </p>
        <div className="text-sm font-mono bg-muted/50 p-3 rounded-lg text-muted-foreground overflow-x-auto">
          <p className="text-primary mb-1"># Example API call</p>
          <p>curl -X GET \</p>
          <p className="pl-4">"{window.location.origin.replace('localhost', 'YOUR_PROJECT_ID.supabase.co')}/functions/v1/public-api/scan-history" \</p>
          <p className="pl-4">-H "x-api-key: YOUR_API_KEY"</p>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          <p className="font-medium mb-1">Available Endpoints:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><code className="text-primary">GET /scan-history</code> - List your scan history</li>
            <li><code className="text-primary">GET /scan/:id</code> - Get specific scan details</li>
            <li><code className="text-primary">GET /health-reports</code> - List your health reports</li>
            <li><code className="text-primary">GET /profile</code> - Get your profile settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
