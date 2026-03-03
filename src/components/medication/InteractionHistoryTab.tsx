import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, AlertOctagon, Info, ShieldAlert, CheckCircle, Clock, Pill, Utensils } from "lucide-react";
import { format } from "date-fns";

interface DrugInteractionRecord {
  id: string;
  scanned_medication: string;
  interacting_medication: string;
  severity: string;
  description: string;
  recommendations: string | null;
  mechanism: string | null;
  acknowledged_at: string | null;
  created_at: string;
  type: 'drug-drug';
}

interface FoodDrugInteractionRecord {
  id: string;
  food_ingredient: string;
  medication_name: string;
  severity: string;
  effect: string;
  recommendation: string | null;
  alternative_foods: string[] | null;
  acknowledged_at: string | null;
  created_at: string;
  type: 'food-drug';
}

type InteractionRecord = DrugInteractionRecord | FoodDrugInteractionRecord;

type Severity = 'minor' | 'moderate' | 'major' | 'contraindicated';
type FilterType = 'all' | 'unacknowledged' | 'drug-drug' | 'food-drug';

const severityConfig = {
  contraindicated: {
    icon: AlertOctagon,
    bgClass: 'bg-red-500/10 border-red-500/30',
    iconClass: 'text-red-500',
    badgeVariant: 'destructive' as const,
    label: 'Contraindicated'
  },
  major: {
    icon: ShieldAlert,
    bgClass: 'bg-orange-500/10 border-orange-500/30',
    iconClass: 'text-orange-500',
    badgeVariant: 'default' as const,
    label: 'Major'
  },
  moderate: {
    icon: AlertTriangle,
    bgClass: 'bg-yellow-500/10 border-yellow-500/30',
    iconClass: 'text-yellow-500',
    badgeVariant: 'secondary' as const,
    label: 'Moderate'
  },
  minor: {
    icon: Info,
    bgClass: 'bg-blue-500/10 border-blue-500/30',
    iconClass: 'text-blue-500',
    badgeVariant: 'outline' as const,
    label: 'Minor'
  }
};

export function InteractionHistoryTab() {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<InteractionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (user) {
      fetchInteractions();
    }
  }, [user]);

  const fetchInteractions = async () => {
    if (!user) return;

    try {
      // Fetch drug-drug interactions
      const { data: drugData, error: drugError } = await supabase
        .from('drug_interactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (drugError) throw drugError;

      // Fetch food-drug interactions
      const { data: foodData, error: foodError } = await supabase
        .from('food_drug_interactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (foodError) throw foodError;

      // Combine and sort by date
      const drugInteractions: DrugInteractionRecord[] = (drugData || []).map(d => ({
        ...d,
        type: 'drug-drug' as const
      }));

      const foodInteractions: FoodDrugInteractionRecord[] = (foodData || []).map(f => ({
        ...f,
        type: 'food-drug' as const
      }));

      const combined = [...drugInteractions, ...foodInteractions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setInteractions(combined);
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInteractions = interactions.filter(i => {
    if (filter === 'all') return true;
    if (filter === 'unacknowledged') return !i.acknowledged_at;
    if (filter === 'drug-drug') return i.type === 'drug-drug';
    if (filter === 'food-drug') return i.type === 'food-drug';
    return true;
  });

  const drugDrugCount = interactions.filter(i => i.type === 'drug-drug').length;
  const foodDrugCount = interactions.filter(i => i.type === 'food-drug').length;
  const unacknowledgedCount = interactions.filter(i => !i.acknowledged_at).length;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Interaction History</h3>
        <p className="text-sm text-muted-foreground">
          When drug or food-drug interactions are detected during scans, they'll appear here for your records.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
            filter === 'all' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          All ({interactions.length})
        </button>
        <button
          onClick={() => setFilter('unacknowledged')}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
            filter === 'unacknowledged' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Unreviewed ({unacknowledgedCount})
        </button>
        <button
          onClick={() => setFilter('drug-drug')}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1 ${
            filter === 'drug-drug' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          <Pill className="w-3 h-3" />
          Drug-Drug ({drugDrugCount})
        </button>
        <button
          onClick={() => setFilter('food-drug')}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1 ${
            filter === 'food-drug' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          <Utensils className="w-3 h-3" />
          Food-Drug ({foodDrugCount})
        </button>
      </div>

      {/* Interactions List */}
      <div className="space-y-3">
        {filteredInteractions.map((interaction) => {
          const severity = interaction.severity as Severity;
          const config = severityConfig[severity] || severityConfig.moderate;
          const Icon = config.icon;
          const isDrugDrug = interaction.type === 'drug-drug';
          
          return (
            <Card 
              key={interaction.id} 
              className={`p-4 border ${config.bgClass}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${config.iconClass} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {isDrugDrug ? (
                      <>
                        <span className="font-medium flex items-center gap-1">
                          <Pill className="w-3 h-3" />
                          {(interaction as DrugInteractionRecord).scanned_medication}
                        </span>
                        <span className="text-muted-foreground">×</span>
                        <span className="font-medium flex items-center gap-1">
                          <Pill className="w-3 h-3" />
                          {(interaction as DrugInteractionRecord).interacting_medication}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium flex items-center gap-1">
                          <Utensils className="w-3 h-3" />
                          {(interaction as FoodDrugInteractionRecord).food_ingredient}
                        </span>
                        <span className="text-muted-foreground">×</span>
                        <span className="font-medium flex items-center gap-1">
                          <Pill className="w-3 h-3" />
                          {(interaction as FoodDrugInteractionRecord).medication_name}
                        </span>
                      </>
                    )}
                    <Badge variant={config.badgeVariant} className="ml-auto">
                      {config.label}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-foreground/90 mb-2">
                    {isDrugDrug 
                      ? (interaction as DrugInteractionRecord).description
                      : (interaction as FoodDrugInteractionRecord).effect
                    }
                  </p>
                  
                  {isDrugDrug ? (
                    (interaction as DrugInteractionRecord).recommendations && (
                      <p className="text-xs text-muted-foreground mb-2">
                        <span className="font-medium">Recommendation:</span> {(interaction as DrugInteractionRecord).recommendations}
                      </p>
                    )
                  ) : (
                    (interaction as FoodDrugInteractionRecord).recommendation && (
                      <p className="text-xs text-muted-foreground mb-2">
                        <span className="font-medium">Recommendation:</span> {(interaction as FoodDrugInteractionRecord).recommendation}
                      </p>
                    )
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(interaction.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {isDrugDrug ? 'Drug-Drug' : 'Food-Drug'}
                    </Badge>
                    {interaction.acknowledged_at && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredInteractions.length === 0 && filter === 'unacknowledged' && (
        <Card className="p-6 text-center">
          <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="text-sm text-muted-foreground">
            All interactions have been reviewed
          </p>
        </Card>
      )}

      {filteredInteractions.length === 0 && (filter === 'drug-drug' || filter === 'food-drug') && (
        <Card className="p-6 text-center">
          <Info className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No {filter === 'drug-drug' ? 'drug-drug' : 'food-drug'} interactions found
          </p>
        </Card>
      )}
    </div>
  );
}
