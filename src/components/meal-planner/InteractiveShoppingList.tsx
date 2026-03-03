import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Plus,
  Copy,
  Share2,
  Trash2,
  Sparkles,
  Check,
  Leaf,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface ShoppingItem {
  id: string;
  item: string;
  quantity: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'bakery' | 'beverages' | 'other';
  estimatedPrice?: string;
  healthierAlternative?: string;
  notes?: string;
  isChecked: boolean;
  addedManually?: boolean;
}

interface InteractiveShoppingListProps {
  items: ShoppingItem[];
  onItemToggle: (id: string) => void;
  onItemRemove: (id: string) => void;
  onAddItem: (item: Partial<ShoppingItem>) => void;
  onClearChecked?: () => void;
}

const categoryConfig: Record<string, { icon: string; label: string; color: string }> = {
  produce: { icon: "🥬", label: "Produce", color: "bg-safe/20 text-safe border-safe/30" },
  dairy: { icon: "🥛", label: "Dairy", color: "bg-primary/20 text-primary border-primary/30" },
  meat: { icon: "🥩", label: "Meat & Protein", color: "bg-danger/20 text-danger border-danger/30" },
  pantry: { icon: "🥫", label: "Pantry", color: "bg-caution/20 text-caution border-caution/30" },
  frozen: { icon: "🧊", label: "Frozen", color: "bg-info/20 text-info border-info/30" },
  bakery: { icon: "🍞", label: "Bakery", color: "bg-caution/20 text-caution border-caution/30" },
  beverages: { icon: "🥤", label: "Beverages", color: "bg-primary/20 text-primary border-primary/30" },
  other: { icon: "📦", label: "Other", color: "bg-muted text-muted-foreground border-muted" },
};

export const InteractiveShoppingList = ({
  items,
  onItemToggle,
  onItemRemove,
  onAddItem,
  onClearChecked,
}: InteractiveShoppingListProps) => {
  const { toast } = useToast();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(categoryConfig))
  );
  const [newItemText, setNewItemText] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const totalItems = items.length;
  const checkedItems = items.filter((i) => i.isChecked).length;
  const uncheckedItems = totalItems - checkedItems;

  // Calculate estimated total (rough estimate)
  const estimatedTotal = items
    .filter((i) => !i.isChecked && i.estimatedPrice)
    .reduce((sum, item) => {
      const match = item.estimatedPrice?.match(/\$?(\d+)/);
      return sum + (match ? parseInt(match[1]) : 3);
    }, 0);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    
    onAddItem({
      item: newItemText.trim(),
      quantity: "1",
      category: "other",
      isChecked: false,
      addedManually: true,
    });
    
    setNewItemText("");
    setShowAddItem(false);
    toast({
      title: "Item Added",
      description: `"${newItemText.trim()}" added to your list`,
    });
  };

  const copyToClipboard = async () => {
    const uncheckedItems = items.filter((i) => !i.isChecked);
    const text = Object.entries(
      uncheckedItems.reduce((acc, item) => {
        const cat = item.category || "other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(`☐ ${item.quantity} ${item.item}`);
        return acc;
      }, {} as Record<string, string[]>)
    )
      .map(([cat, items]) => `${categoryConfig[cat]?.label || cat}:\n${items.join("\n")}`)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(`🛒 Shopping List\n\n${text}`);
      toast({
        title: "Copied!",
        description: "Shopping list copied to clipboard",
      });
    } catch {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const uncheckedItems = items.filter((i) => !i.isChecked);
    const text = uncheckedItems
      .map((item) => `☐ ${item.quantity} ${item.item}`)
      .join("\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Shopping List",
          text: `🛒 Shopping List\n\n${text}`,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      copyToClipboard();
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/30 bg-primary/5 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-primary/20 bg-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Shopping List</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={copyToClipboard}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
          <span>{uncheckedItems} items left</span>
          {checkedItems > 0 && (
            <span className="text-safe">✓ {checkedItems} done</span>
          )}
          {estimatedTotal > 0 && (
            <span className="ml-auto">Est. ~${estimatedTotal - 5}-${estimatedTotal + 10}</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {totalItems > 0 && (
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-safe"
            initial={{ width: 0 }}
            animate={{ width: `${(checkedItems / totalItems) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Categories */}
      <div className="divide-y divide-border">
        {Object.entries(categoryConfig).map(([category, config]) => {
          const categoryItems = itemsByCategory[category];
          if (!categoryItems?.length) return null;

          const categoryChecked = categoryItems.filter((i) => i.isChecked).length;
          const isExpanded = expandedCategories.has(category);

          return (
            <Collapsible
              key={category}
              open={isExpanded}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className="font-medium text-foreground text-sm">
                    {config.label}
                  </span>
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 border-border text-muted-foreground">
                    {categoryItems.length - categoryChecked}
                  </Badge>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-1">
                  <AnimatePresence>
                    {categoryItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10, height: 0 }}
                        className={cn(
                          "group flex items-start gap-3 p-2 rounded-lg transition-all",
                          item.isChecked
                            ? "bg-safe/10 opacity-60"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <Checkbox
                          checked={item.isChecked}
                          onCheckedChange={() => onItemToggle(item.id)}
                          className="mt-0.5 border-muted-foreground/40 data-[state=checked]:bg-safe data-[state=checked]:border-safe"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-sm font-medium transition-all",
                                item.isChecked
                                  ? "line-through text-muted-foreground/50"
                                  : "text-foreground"
                              )}
                            >
                              <span className="text-muted-foreground mr-1">{item.quantity}</span>
                              {item.item}
                            </span>
                            {item.estimatedPrice && !item.isChecked && (
                              <span className="text-xs text-muted-foreground">
                                {item.estimatedPrice}
                              </span>
                            )}
                          </div>
                          
                          {/* Healthier Alternative */}
                          {item.healthierAlternative && !item.isChecked && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-safe">
                              <Sparkles className="w-3 h-3" />
                              <span>Try: {item.healthierAlternative}</span>
                            </div>
                          )}
                          
                          {item.notes && !item.isChecked && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5">{item.notes}</p>
                          )}
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onItemRemove(item.id)}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger hover:bg-danger/10 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Add Item Section */}
      <div className="p-3 border-t border-border">
        <AnimatePresence mode="wait">
          {showAddItem ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2"
            >
              <Input
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Add an item..."
                className="flex-1 h-9 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleAddItem}
                disabled={!newItemText.trim()}
                className="h-9 bg-safe hover:bg-safe/90"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddItem(false);
                  setNewItemText("");
                }}
                className="h-9 text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddItem(true)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add item
              </Button>
              
              {checkedItems > 0 && onClearChecked && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearChecked}
                  className="text-danger/60 hover:text-danger hover:bg-danger/10"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear done ({checkedItems})
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
