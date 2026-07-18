/** Ultimate fallback if primary + brand fallback both fail */
export const IMAGE_PLACEHOLDER =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400"

/**
 * Wikipedia Commons PNG thumbs for international chains.
 * Use 250px (not 200px) — Wikimedia only serves certain thumb widths.
 * Paths verified via Commons API (Jul 2026).
 */
export const CHAIN_LOGOS = {
  mcdonalds:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/250px-McDonald%27s_Golden_Arches.svg.png",
  kfc: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/KFC_logo.svg/250px-KFC_logo.svg.png",
  burgerKing:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Burger_King_logo_%281999%E2%80%932020%29.svg/250px-Burger_King_logo_%281999%E2%80%932020%29.svg.png",
  pizzaHut:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Pizza_Hut_logo.svg/250px-Pizza_Hut_logo.svg.png",
  subway:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Subway_2016_logo.svg/250px-Subway_2016_logo.svg.png",
  starbucks:
    "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/250px-Starbucks_Corporation_Logo_2011.svg.png",
  popeyes:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Popeyes_logo.svg/250px-Popeyes_logo.svg.png",
  shakeShack:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Shake_Shack_logo.svg/250px-Shake_Shack_logo.svg.png",
  dominos:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Domino%27s_pizza_logo.svg/250px-Domino%27s_pizza_logo.svg.png",
  timHortons:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Tim_Hortons_logo.svg/250px-Tim_Hortons_logo.svg.png",
  hardees:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Hardee_brand_logo.svg/250px-Hardee_brand_logo.svg.png",
  nandos:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Nando%27s_wordmark.svg/250px-Nando%27s_wordmark.svg.png",
  kudu:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Kudu_logo_%28Saudi_Arabia%2C_2016%29_%28without_wordmark_variant%29.svg/250px-Kudu_logo_%28Saudi_Arabia%2C_2016%29_%28without_wordmark_variant%29.svg.png",
} as const

/** Reliable Unsplash food / venue photos for Saudi & local spots */
export const FOOD_PHOTOS = {
  arabicGrill: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400",
  friedChicken: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400",
  kabsaRice: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400",
  restaurantInterior: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
  fineDining: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
  buffet: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
  burger: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400",
  coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
  desserts: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800",
  grilledChicken: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400",
  shawarma: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400",
  lounge: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400",
} as const
