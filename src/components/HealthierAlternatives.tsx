import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Alternative {
  name: string;
  brand?: string;
  reason: string;
  estimatedScore: number;
  keyBenefits: string[];
}

interface HealthierAlternativesProps {
  alternatives: Alternative[];
  currentScore: number;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-danger";
};

const getScoreBg = (score: number) => {
  if (score >= 80) return "bg-success/10";
  if (score >= 50) return "bg-warning/10";
  return "bg-danger/10";
};

export const HealthierAlternatives = ({ alternatives, currentScore }: HealthierAlternativesProps) => {
  if (!alternatives || alternatives.length === 0) return null;

  // If product is already healthy, show a different message
  const isAlreadyHealthy = currentScore >= 80;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          {isAlreadyHealthy ? "Similar Healthy Options" : "Healthier Alternatives"}
        </CardTitle>
        {!isAlreadyHealthy && (
          <p className="text-sm text-muted-foreground">
            Consider these better options next time you shop
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {alternatives.map((alt, index) => (
          <motion.div
            key={alt.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-foreground truncate">{alt.name}</h4>
                  {alt.brand && (
                    <span className="text-sm text-muted-foreground">by {alt.brand}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{alt.reason}</p>
                
                {alt.keyBenefits && alt.keyBenefits.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {alt.keyBenefits.map((benefit, i) => (
                      <Badge 
                        key={i} 
                        variant="secondary" 
                        className="text-xs font-normal gap-1"
                      >
                        <Check className="w-3 h-3" />
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className={`flex flex-col items-center shrink-0 px-3 py-2 rounded-lg ${getScoreBg(alt.estimatedScore)}`}>
                <span className={`text-xl font-bold ${getScoreColor(alt.estimatedScore)}`}>
                  {alt.estimatedScore}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Score</span>
                {alt.estimatedScore > currentScore && (
                  <div className="flex items-center gap-0.5 mt-1 text-success">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-[10px] font-medium">+{alt.estimatedScore - currentScore}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};
