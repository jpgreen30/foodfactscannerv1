import { forwardRef } from "react";
import { format } from "date-fns";

interface Ingredient {
  item: string;
  amount: string;
  notes?: string;
}

interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface Meal {
  name: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  prepTime: string;
  cookTime: string;
  servings: number;
  safetyScore: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: Nutrition;
  healthBenefits: string[];
  warnings: string[];
}

interface PrintableRecipeProps {
  meal: Meal;
  showLogo?: boolean;
}

export const PrintableRecipe = forwardRef<HTMLDivElement, PrintableRecipeProps>(
  ({ meal, showLogo = true }, ref) => {
    return (
      <div
        ref={ref}
        className="p-8 bg-white text-black max-w-2xl mx-auto print:p-4"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-1">{meal.name}</h1>
              <p className="text-gray-600 capitalize">{meal.type}</p>
            </div>
            {showLogo && (
              <div className="text-right text-sm text-gray-500">
                <p className="font-bold text-[#3D8B8B]">FoodFactScanner</p>
                <p>Meal Planner</p>
                <p>{format(new Date(), "MMM d, yyyy")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-4 gap-4 mb-6 text-center">
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-lg font-bold">{meal.prepTime}</p>
            <p className="text-xs text-gray-600">Prep Time</p>
          </div>
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-lg font-bold">{meal.cookTime}</p>
            <p className="text-xs text-gray-600">Cook Time</p>
          </div>
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-lg font-bold">{meal.servings}</p>
            <p className="text-xs text-gray-600">Servings</p>
          </div>
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-lg font-bold">{meal.nutrition.calories}</p>
            <p className="text-xs text-gray-600">Calories</p>
          </div>
        </div>

        {/* Warnings if any */}
        {meal.warnings?.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <p className="font-bold text-yellow-800 mb-1">⚠️ Notes</p>
            <ul className="text-sm text-yellow-700">
              {meal.warnings.map((w, i) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-8">
          {/* Ingredients */}
          <div>
            <h2 className="text-xl font-bold mb-3 border-b pb-2">Ingredients</h2>
            <ul className="space-y-2">
              {meal.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-4 h-4 border border-gray-400 rounded flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>{ing.amount}</strong> {ing.item}
                    {ing.notes && <span className="text-gray-500"> ({ing.notes})</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Nutrition */}
          <div>
            <h2 className="text-xl font-bold mb-3 border-b pb-2">Nutrition Facts</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-1">
                <span>Calories</span>
                <strong>{meal.nutrition.calories}</strong>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>Protein</span>
                <strong>{meal.nutrition.protein}g</strong>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>Carbohydrates</span>
                <strong>{meal.nutrition.carbs}g</strong>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>Fat</span>
                <strong>{meal.nutrition.fat}g</strong>
              </div>
              <div className="flex justify-between">
                <span>Fiber</span>
                <strong>{meal.nutrition.fiber}g</strong>
              </div>
            </div>

            {/* Health Benefits */}
            {meal.healthBenefits?.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="font-bold text-green-800 text-sm mb-1">Health Benefits</p>
                <ul className="text-xs text-green-700">
                  {meal.healthBenefits.map((b, i) => (
                    <li key={i}>✓ {b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-3 border-b pb-2">Instructions</h2>
          <ol className="space-y-4">
            {meal.instructions.map((step, i) => (
              <li key={i} className="flex gap-4 text-sm">
                <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <p className="flex-1 pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-xs text-gray-400">
          <p>Generated by FoodFactScanner AI Meal Planner</p>
        </div>
      </div>
    );
  }
);

PrintableRecipe.displayName = "PrintableRecipe";
