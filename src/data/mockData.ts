import { Ingredient } from "@/components/IngredientCard";

export interface ScanResult {
  productName: string;
  brand: string;
  healthScore: number;
  ingredients: Ingredient[];
  nutrition: {
    calories: number;
    fat: number;
    saturatedFat: number;
    carbs: number;
    sugar: number;
    protein: number;
    sodium: number;
    fiber: number;
  };
  dietaryFlags: {
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    pregnancySafe: boolean;
    heartHealthy: boolean;
    diabeticFriendly: boolean;
  };
  recalls?: {
    hasRecall: boolean;
    reason?: string;
    severity?: "low" | "medium" | "high";
    action?: string;
  };
  heavyMetals?: {
    found: boolean;
    arsenic: { ppb: number | null; level: "safe" | "caution" | "avoid" };
    lead: { ppb: number | null; level: "safe" | "caution" | "avoid" };
    cadmium: { ppb: number | null; level: "safe" | "caution" | "avoid" };
    mercury: { ppb: number | null; level: "safe" | "caution" | "avoid" };
    overallVerdict: "safe" | "caution" | "avoid";
    confidence: "high" | "medium" | "low";
    labSource?: string;
    testDate?: string;
    notes?: string;
  };
}

// Mock data for demonstration
export const mockScanResult: ScanResult = {
  productName: "Organic Whole Grain Cereal",
  brand: "Nature's Best",
  healthScore: 72,
  ingredients: [
    {
      name: "Whole Grain Oats",
      definition: "Oats with the bran, germ, and endosperm intact, providing maximum nutritional value.",
      purpose: "Primary ingredient providing fiber, protein, and complex carbohydrates.",
      isNatural: true,
      riskLevel: "safe",
      regulatoryStatus: "GRAS (Generally Recognized As Safe) by FDA",
    },
    {
      name: "Cane Sugar",
      definition: "Sucrose derived from sugar cane, used as a sweetener.",
      purpose: "Adds sweetness and palatability to the cereal.",
      isNatural: true,
      riskLevel: "caution",
      healthConcerns: [
        "High consumption linked to obesity and diabetes",
        "May contribute to dental cavities",
      ],
      regulatoryStatus: "FDA approved with no restrictions",
    },
    {
      name: "Canola Oil",
      definition: "Vegetable oil derived from rapeseed, low in saturated fat.",
      purpose: "Used to provide texture and prevent the cereal from sticking.",
      isNatural: true,
      riskLevel: "safe",
      regulatoryStatus: "FDA approved",
    },
    {
      name: "Natural Flavors",
      definition: "Flavoring substances derived from plant or animal sources.",
      purpose: "Enhances the taste profile of the product.",
      isNatural: true,
      riskLevel: "caution",
      healthConcerns: [
        "Exact composition not always disclosed",
        "May contain allergens in some cases",
      ],
      regulatoryStatus: "FDA approved, but specific ingredients may vary",
    },
    {
      name: "BHT (Butylated Hydroxytoluene)",
      definition: "A synthetic antioxidant used as a preservative in foods.",
      purpose: "Prevents oxidation and extends shelf life.",
      isNatural: false,
      riskLevel: "danger",
      healthConcerns: [
        "Some studies suggest potential carcinogenic effects at high doses",
        "May cause hyperactivity in some children",
        "Banned in some countries including Japan and parts of Europe",
      ],
      regulatoryStatus: "FDA approved with usage limits",
      iarcClassification: "Group 2B - Possibly carcinogenic to humans",
    },
    {
      name: "Vitamin D3",
      definition: "Cholecalciferol, a fat-soluble vitamin essential for bone health.",
      purpose: "Fortification to improve nutritional value.",
      isNatural: false,
      riskLevel: "safe",
      regulatoryStatus: "FDA approved for fortification",
    },
    {
      name: "Iron",
      definition: "Essential mineral added for fortification.",
      purpose: "Supports blood health and prevents anemia.",
      isNatural: false,
      riskLevel: "safe",
      regulatoryStatus: "FDA approved for fortification",
    },
  ],
  nutrition: {
    calories: 210,
    fat: 3,
    saturatedFat: 0.5,
    carbs: 42,
    sugar: 12,
    protein: 5,
    sodium: 190,
    fiber: 4,
  },
  dietaryFlags: {
    vegan: false,
    glutenFree: false,
    dairyFree: true,
    pregnancySafe: true,
    heartHealthy: true,
    diabeticFriendly: false,
  },
  recalls: {
    hasRecall: false,
  },
};

export const mockScanResult2: ScanResult = {
  productName: "Ultra Energy Drink",
  brand: "PowerMax",
  healthScore: 28,
  ingredients: [
    {
      name: "Carbonated Water",
      definition: "Water infused with carbon dioxide gas under pressure.",
      purpose: "Provides the base of the drink and the fizzy sensation.",
      isNatural: true,
      riskLevel: "safe",
      regulatoryStatus: "No restrictions",
    },
    {
      name: "High Fructose Corn Syrup",
      definition: "A sweetener made from corn starch that has been processed to convert glucose to fructose.",
      purpose: "Provides sweetness at lower cost than sugar.",
      isNatural: false,
      riskLevel: "danger",
      healthConcerns: [
        "Linked to obesity, diabetes, and metabolic syndrome",
        "May contribute to fatty liver disease",
        "Associated with increased inflammation",
      ],
      regulatoryStatus: "FDA approved, no usage limits",
    },
    {
      name: "Taurine",
      definition: "An amino acid that occurs naturally in the body and in some foods.",
      purpose: "Added for its supposed energy-boosting properties.",
      isNatural: true,
      riskLevel: "caution",
      healthConcerns: [
        "High doses may interact with caffeine",
        "Effects on children not well studied",
      ],
      regulatoryStatus: "FDA approved for use in energy drinks",
    },
    {
      name: "Caffeine",
      definition: "A natural stimulant found in coffee beans, tea leaves, and cacao pods.",
      purpose: "Provides stimulant effect and increases alertness.",
      isNatural: true,
      riskLevel: "caution",
      healthConcerns: [
        "Can cause insomnia, restlessness, and increased heart rate",
        "May lead to dependence",
        "Not recommended for children or pregnant women",
      ],
      regulatoryStatus: "FDA approved with recommended limits",
    },
    {
      name: "Red 40 (Allura Red)",
      definition: "A synthetic red azo dye used as food coloring.",
      purpose: "Provides red color to the beverage.",
      isNatural: false,
      riskLevel: "danger",
      healthConcerns: [
        "May cause hyperactivity in children",
        "Potential allergen",
        "Banned in several European countries",
      ],
      regulatoryStatus: "FDA approved, but banned or restricted in parts of Europe",
      iarcClassification: "Not classified",
    },
    {
      name: "Sodium Benzoate",
      definition: "A synthetic preservative derived from benzoic acid.",
      purpose: "Prevents microbial growth and extends shelf life.",
      isNatural: false,
      riskLevel: "caution",
      healthConcerns: [
        "Can form benzene (a carcinogen) when combined with vitamin C",
        "May exacerbate hyperactivity in some children",
      ],
      regulatoryStatus: "FDA approved with usage limits",
    },
  ],
  nutrition: {
    calories: 230,
    fat: 0,
    saturatedFat: 0,
    carbs: 58,
    sugar: 54,
    protein: 0,
    sodium: 160,
    fiber: 0,
  },
  dietaryFlags: {
    vegan: true,
    glutenFree: true,
    dairyFree: true,
    pregnancySafe: false,
    heartHealthy: false,
    diabeticFriendly: false,
  },
  recalls: {
    hasRecall: false,
  },
};
