const FDC_API_KEY = process.env.NEXT_PUBLIC_FDC_API_KEY || "";
const BASE_URL = "https://api.nal.usda.gov/fdc/v1";

export interface FDCNutrient {
  nutrientId?: number;
  nutrientNumber?: string;
  nutrientName?: string;
  name?: string;
  unitName: string;
  value: number;
}

export interface FDCFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  foodNutrients: FDCNutrient[];
  servingSize?: number;
  servingSizeUnit?: string;
}

export async function searchFoods(query: string): Promise<FDCFood[]> {
  if (!query || !FDC_API_KEY) return [];
  
  const url = `${BASE_URL}/foods/search?query=${encodeURIComponent(query)}&api_key=${FDC_API_KEY}&pageSize=10&dataType=Foundation,SR%20Legacy,Branded`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("FDC API Error");
    const data = await res.json();
    return data.foods || [];
  } catch (err) {
    console.error("FDC Search Error:", err);
    return [];
  }
}

/**
 * Robustly find a nutrient value from FDC data.
 * Tries nutrientNumber first (standard FDC IDs), then name matching.
 */
export function findNutrient(food: FDCFood, type: 'calories' | 'protein' | 'fat' | 'carbs'): number {
  const nutrients = food.foodNutrients;
  if (!nutrients) return 0;
  
  const search = (nums: string[], pattern: RegExp) => {
    // 1. Try nutrientNumber (standard across FDC)
    const byNum = nutrients.find(n => n.nutrientNumber && nums.includes(n.nutrientNumber.toString()));
    if (byNum) return byNum.value;
    
    // 2. Try nutrientId (sometimes used in different formats)
    const byId = nutrients.find(n => n.nutrientId && nums.includes(n.nutrientId.toString()));
    if (byId) return byId.value;

    // 3. Fallback to name matching
    const byName = nutrients.find(n => {
      const name = n.nutrientName || n.name || "";
      return pattern.test(name);
    });
    return byName ? byName.value : 0;
  };

  switch (type) {
    case 'calories':
      return search(['208', '1008'], /Energy/i);
    case 'protein':
      return search(['203', '1003'], /Protein/i);
    case 'fat':
      return search(['204', '1004'], /Total lipid/i);
    case 'carbs':
      return search(['205', '1005'], /Carbohydrate/i);
    default:
      return 0;
  }
}
