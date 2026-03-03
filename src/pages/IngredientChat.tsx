import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useDebug } from "@/contexts/DebugContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle,
  Send,
  Loader2,
  Lock,
  Crown,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const IngredientChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getEffectiveTier } = useDebug();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchUserProfile = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user!.id)
        .maybeSingle();

      if (data) {
        setSubscriptionTier(data.subscription_tier || "free");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingredient-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ message: userMessage }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        if (response.status === 402) {
          throw new Error("Usage limit reached. Please add credits to continue.");
        }
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error.message || "Could not get a response",
        variant: "destructive",
      });
      // Remove the user message if there was an error
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const effectiveTier = getEffectiveTier(subscriptionTier);
  const hasAccess = ["basic", "premium", "annual", "family", "pro"].includes(effectiveTier || "");

  // Show upgrade prompt for non-Pro users
  if (user && !hasAccess) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 py-8"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-foreground uppercase">
              AI Ingredient Chat
            </h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Ask questions about any ingredient's safety, alternatives, and health effects
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-primary/10 rounded-2xl border-2 border-primary"
          >
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-8 h-8 text-primary" />
              <div>
                <h2 className="font-bold text-foreground">Paid Feature</h2>
                <p className="text-sm text-muted-foreground">Available with any subscription</p>
              </div>
            </div>
            
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-foreground">
                <MessageCircle className="w-4 h-4 text-primary" />
                Ask about any ingredient
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                Get safer alternatives
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="w-4 h-4 text-primary" />
                Understand health risks
              </li>
            </ul>

            <Button
              onClick={() => navigate("/subscription")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Crown className="w-4 h-4 mr-2" />
              Subscribe Now
            </Button>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout className="flex flex-col">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-2">
            <MessageCircle className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-black text-foreground uppercase tracking-wide">
            AI Ingredient Chat
          </h1>
          <p className="text-sm text-muted-foreground">
            Ask about any ingredient's safety
          </p>
        </motion.div>

        {/* Example prompts when empty */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 flex flex-col justify-center space-y-3"
          >
            <p className="text-center text-muted-foreground text-sm mb-2">Try asking:</p>
            {[
              "Is red dye 40 safe for children?",
              "What are healthier alternatives to high fructose corn syrup?",
              "Does MSG cause headaches?",
              "What preservatives should pregnant women avoid?",
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => setInput(prompt)}
                className="p-3 bg-muted/50 rounded-xl border border-border text-left text-muted-foreground hover:bg-muted hover:border-border transition-colors"
              >
                <Info className="w-4 h-4 inline mr-2 text-primary" />
                {prompt}
              </button>
            ))}
          </motion.div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" && "flex-row-reverse"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      message.role === "user"
                        ? "bg-primary/20"
                        : "bg-safe/20"
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-primary" />
                    ) : (
                      <Bot className="w-4 h-4 text-safe" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[85%] p-3 rounded-2xl",
                      message.role === "user"
                        ? "bg-primary/20 text-foreground"
                        : "bg-muted/50 text-foreground"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-safe/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-safe" />
                </div>
                <div className="bg-muted/50 p-3 rounded-2xl">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 pt-2 border-t border-border"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask about an ingredient..."
            className="flex-1 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default IngredientChat;
