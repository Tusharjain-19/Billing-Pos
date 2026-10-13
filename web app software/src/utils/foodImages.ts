/**
 * Curated high-resolution food dish imagery & auto-suggestion engine
 */

export interface FoodSuggestion {
  name: string;
  keywords: string[];
  imageUrl: string;
}

export const CURATED_FOOD_PHOTOS: FoodSuggestion[] = [
  {
    name: 'Masala Chai / Tea',
    keywords: ['chai', 'tea', 'masala chai', 'cutting chai', 'adrak chai', 'elaichi chai'],
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Cold Coffee / Iced Coffee',
    keywords: ['coffee', 'cold coffee', 'iced coffee', 'frappe', 'cappuccino', 'latte', 'espresso'],
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Crispy Veg Burger',
    keywords: ['burger', 'veg burger', 'cheese burger', 'aloo tikki burger', 'chicken burger', 'paneer burger'],
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Margherita / Cheese Pizza',
    keywords: ['pizza', 'margherita', 'cheese pizza', 'paneer pizza', 'farmhouse', 'veg pizza', 'slice'],
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Grilled Club Sandwich',
    keywords: ['sandwich', 'grilled sandwich', 'cheese sandwich', 'club sandwich', 'toast', 'bombay sandwich'],
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Crispy French Fries',
    keywords: ['fries', 'french fries', 'peri peri fries', 'potato fries', 'finger chips'],
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Paneer Butter Masala',
    keywords: ['paneer', 'paneer butter masala', 'shahi paneer', 'kadai paneer', 'matar paneer', 'paneer tikka'],
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Veg Dum Biryani',
    keywords: ['biryani', 'dum biryani', 'veg biryani', 'chicken biryani', 'pulao', 'hyderabadi biryani'],
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'South Indian Masala Dosa',
    keywords: ['dosa', 'masala dosa', 'mysore dosa', 'plain dosa', 'idli', 'vada', 'sambhar', 'uttapam'],
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Chinese Hakka Noodles',
    keywords: ['noodles', 'hakka noodles', 'chowmein', 'veg noodles', 'schezwan noodles', 'maggi'],
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Steamed / Fried Momos',
    keywords: ['momo', 'momos', 'dumplings', 'dim sum', 'veg momos', 'paneer momos'],
    imageUrl: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Crispy Samosa / Kachori',
    keywords: ['samosa', 'kachori', 'patties', 'pakora', 'bhajiya', 'bread pakora'],
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Pav Bhaji / Vada Pav',
    keywords: ['pav bhaji', 'vada pav', 'misal pav', 'butter pav', 'maska bun'],
    imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Pasta / Macaroni',
    keywords: ['pasta', 'white sauce pasta', 'red sauce pasta', 'arrabbiata', 'macaroni', 'alfredo'],
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Fresh Mango Lassi / Shake',
    keywords: ['lassi', 'mango lassi', 'shake', 'mango shake', 'smoothie', 'mojito', 'lemonade', 'juice'],
    imageUrl: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Indian Sweets / Gulab Jamun',
    keywords: ['gulab jamun', 'rasgulla', 'sweet', 'mithai', 'jalebi', 'kheer', 'halwa', 'ladoo'],
    imageUrl: 'https://images.unsplash.com/photo-1589948101657-36e2f1c84144?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Ice Cream Sundae / Brownie',
    keywords: ['ice cream', 'sundae', 'brownie', 'cake', 'pastry', 'waffle', 'dessert'],
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Dal Makhani / Dal Tadka',
    keywords: ['dal', 'dal makhani', 'dal tadka', 'yellow dal', 'chole', 'rajma', 'curry'],
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Butter Roti / Tandoori Naan',
    keywords: ['roti', 'naan', 'butter naan', 'paratha', 'kulcha', 'tandoori roti'],
    imageUrl: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Complete Restaurant Thali',
    keywords: ['thali', 'special thali', 'meal', 'lunch combo', 'deluxe thali', 'platter'],
    imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=500&q=80',
  },
];

/**
 * Find matching food suggestions based on user typed product name
 */
export function getFoodSuggestionsForName(query: string): FoodSuggestion[] {
  if (!query || query.trim().length < 2) {
    return CURATED_FOOD_PHOTOS.slice(0, 8);
  }

  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/).filter(w => w.length > 1);

  // Score each suggestion
  const scored = CURATED_FOOD_PHOTOS.map(item => {
    let score = 0;
    if (item.name.toLowerCase().includes(q)) score += 10;
    for (const kw of item.keywords) {
      if (q.includes(kw) || kw.includes(q)) score += 5;
      for (const w of words) {
        if (kw.includes(w)) score += 3;
      }
    }
    return { item, score };
  });

  const matches = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.item);

  if (matches.length > 0) {
    return matches.slice(0, 6);
  }

  return CURATED_FOOD_PHOTOS.slice(0, 6);
}

/**
 * Get the best matching food image URL or dynamic CDN image for any food name
 */
export function getAutoFoodImageUrl(productName: string): string {
  const matches = getFoodSuggestionsForName(productName);
  if (matches.length > 0 && productName.trim().length >= 2) {
    return matches[0].imageUrl;
  }
  return CURATED_FOOD_PHOTOS[0].imageUrl;
}
