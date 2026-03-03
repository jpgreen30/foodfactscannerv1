import { useState, useCallback, useEffect } from "react";
import { ShoppingItem } from "@/components/meal-planner/InteractiveShoppingList";

const STORAGE_KEY = "meal-planner-shopping-list";

// Convert simple shopping list strings to structured items
export const convertToShoppingItems = (
  shoppingList: string[] | ShoppingItem[]
): ShoppingItem[] => {
  if (!shoppingList || shoppingList.length === 0) return [];

  // Check if already structured
  if (typeof shoppingList[0] === "object" && "item" in shoppingList[0]) {
    return shoppingList as ShoppingItem[];
  }

  // Convert simple strings to structured items
  return (shoppingList as string[]).map((itemStr, index) => {
    const item = parseShoppingItem(itemStr);
    return {
      id: `item-${index}-${Date.now()}`,
      item: item.name,
      quantity: item.quantity,
      category: categorizeItem(item.name),
      estimatedPrice: estimatePrice(item.name),
      isChecked: false,
      addedManually: false,
    };
  });
};

// Parse quantity and item name from string like "2 cups rice" or "rice"
const parseShoppingItem = (str: string): { quantity: string; name: string } => {
  const trimmed = str.trim();
  
  // Match patterns like "2 cups", "1/2 lb", "3-4", "1 dozen"
  const quantityMatch = trimmed.match(/^([\d\/.,-]+\s*(?:cups?|cup|oz|lbs?|lb|dozen|pack|cans?|bottles?|bags?|heads?|bunches?|cloves?|pieces?|pcs?|tbsp|tsp)?)\s+(.+)$/i);
  
  if (quantityMatch) {
    return {
      quantity: quantityMatch[1].trim(),
      name: quantityMatch[2].trim(),
    };
  }

  return {
    quantity: "1",
    name: trimmed,
  };
};

// Categorize items by keywords
const categorizeItem = (
  itemName: string
): ShoppingItem["category"] => {
  const name = itemName.toLowerCase();

  // Produce
  if (
    /lettuce|spinach|kale|broccoli|carrot|tomato|onion|garlic|pepper|cucumber|celery|avocado|apple|banana|orange|lemon|lime|berry|strawberr|blueberr|grape|mango|pineapple|melon|watermelon|potato|sweet potato|squash|zucchini|mushroom|corn|beans|peas|asparagus|cauliflower|cabbage|beet|radish|turnip|parsley|cilantro|basil|mint|ginger|fresh/.test(
      name
    )
  ) {
    return "produce";
  }

  // Dairy
  if (
    /milk|cheese|yogurt|butter|cream|egg|sour cream|cottage|ricotta|mozzarella|parmesan|cheddar/.test(
      name
    )
  ) {
    return "dairy";
  }

  // Meat & Protein
  if (
    /chicken|beef|pork|turkey|fish|salmon|tuna|shrimp|bacon|sausage|ham|steak|ground|lamb|duck|meat|protein|tofu|tempeh/.test(
      name
    )
  ) {
    return "meat";
  }

  // Frozen
  if (/frozen|ice cream|popsicle|ice/.test(name)) {
    return "frozen";
  }

  // Bakery
  if (
    /bread|bagel|muffin|roll|bun|croissant|tortilla|pita|naan|cake|pastry|donut|cookie/.test(
      name
    )
  ) {
    return "bakery";
  }

  // Beverages
  if (
    /juice|water|soda|coffee|tea|drink|beverage|wine|beer|milk/.test(name)
  ) {
    return "beverages";
  }

  // Pantry (default for dry goods, spices, canned goods)
  if (
    /rice|pasta|flour|sugar|oil|vinegar|sauce|can|beans|lentils|oats|cereal|honey|syrup|spice|salt|pepper|cumin|paprika|oregano|thyme|cinnamon|vanilla|baking|broth|stock/.test(
      name
    )
  ) {
    return "pantry";
  }

  return "other";
};

// Estimate rough prices
const estimatePrice = (itemName: string): string => {
  const name = itemName.toLowerCase();

  // Premium items
  if (/salmon|steak|shrimp|lobster|organic|grass-fed|wild/.test(name)) {
    return "$8-15";
  }

  // Meat & Protein
  if (/chicken|beef|pork|turkey|fish/.test(name)) {
    return "$5-10";
  }

  // Dairy
  if (/cheese|yogurt|butter|cream/.test(name)) {
    return "$3-6";
  }

  // Produce
  if (/avocado|berr|mango|organic/.test(name)) {
    return "$4-7";
  }

  // Basic produce
  if (
    /lettuce|spinach|carrot|onion|garlic|potato|tomato|apple|banana|orange/.test(
      name
    )
  ) {
    return "$2-4";
  }

  // Pantry staples
  if (/rice|pasta|flour|oil|vinegar|sauce|canned/.test(name)) {
    return "$2-5";
  }

  return "$2-5";
};

export const useShoppingList = (initialItems?: string[] | ShoppingItem[]) => {
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    // Try to load from localStorage first
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors
    }

    // Fall back to initial items
    return initialItems ? convertToShoppingItems(initialItems) : [];
  });

  // Save to localStorage when items change
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  // Update items when new meal plan is generated
  const setShoppingList = useCallback((newItems: string[] | ShoppingItem[]) => {
    const structured = convertToShoppingItems(newItems);
    setItems(structured);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(structured));
  }, []);

  const toggleItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addItem = useCallback((newItem: Partial<ShoppingItem>) => {
    const item: ShoppingItem = {
      id: `manual-${Date.now()}`,
      item: newItem.item || "New Item",
      quantity: newItem.quantity || "1",
      category: newItem.category || "other",
      isChecked: false,
      addedManually: true,
      estimatedPrice: newItem.estimatedPrice || estimatePrice(newItem.item || ""),
      healthierAlternative: newItem.healthierAlternative,
      notes: newItem.notes,
    };
    setItems((prev) => [...prev, item]);
  }, []);

  const clearChecked = useCallback(() => {
    setItems((prev) => prev.filter((item) => !item.isChecked));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getShareText = useCallback(() => {
    const unchecked = items.filter((i) => !i.isChecked);
    const byCategory = unchecked.reduce((acc, item) => {
      const cat = item.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(`☐ ${item.quantity} ${item.item}`);
      return acc;
    }, {} as Record<string, string[]>);

    return (
      "🛒 Shopping List\n\n" +
      Object.entries(byCategory)
        .map(([, items]) => items.join("\n"))
        .join("\n\n")
    );
  }, [items]);

  return {
    items,
    setShoppingList,
    toggleItem,
    removeItem,
    addItem,
    clearChecked,
    clearAll,
    getShareText,
    totalItems: items.length,
    checkedCount: items.filter((i) => i.isChecked).length,
    uncheckedCount: items.filter((i) => !i.isChecked).length,
  };
};
