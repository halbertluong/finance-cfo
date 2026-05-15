import { Transaction, CategorizationResult } from '@/models/types';

const MERCHANT_LOOKUP: Record<string, { categoryId: string; subcategoryId: string; merchant: string; tags: string[] }> = {
  // ── Groceries ──────────────────────────────────────────────────────────────
  'whole foods': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Whole Foods', tags: ['grocery'] },
  'trader joe': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: "Trader Joe's", tags: ['grocery'] },
  'safeway': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Safeway', tags: ['grocery'] },
  'kroger': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Kroger', tags: ['grocery'] },
  'fred meyer': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Fred Meyer', tags: ['grocery'] },
  'new seasons': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'New Seasons Market', tags: ['grocery'] },
  'winco': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'WinCo Foods', tags: ['grocery'] },
  'albertsons': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Albertsons', tags: ['grocery'] },
  'qfc': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'QFC', tags: ['grocery'] },
  'market of choice': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Market of Choice', tags: ['grocery'] },
  'aldi': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Aldi', tags: ['grocery'] },
  'publix': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Publix', tags: ['grocery'] },
  'heb ': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'H-E-B', tags: ['grocery'] },
  'meijer': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Meijer', tags: ['grocery'] },
  'stop & shop': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Stop & Shop', tags: ['grocery'] },
  'wegmans': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Wegmans', tags: ['grocery'] },
  'sprouts': { categoryId: 'groceries', subcategoryId: 'groceries-specialty', merchant: 'Sprouts', tags: ['grocery'] },
  'natural grocers': { categoryId: 'groceries', subcategoryId: 'groceries-specialty', merchant: 'Natural Grocers', tags: ['grocery'] },
  'costco': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Costco', tags: ['grocery', 'bulk'] },

  // ── Dining — Coffee ────────────────────────────────────────────────────────
  'starbucks': { categoryId: 'dining', subcategoryId: 'dining-coffee', merchant: 'Starbucks', tags: ['coffee', 'recurring'] },
  'dunkin': { categoryId: 'dining', subcategoryId: 'dining-coffee', merchant: "Dunkin'", tags: ['coffee'] },
  'dutch bros': { categoryId: 'dining', subcategoryId: 'dining-coffee', merchant: 'Dutch Bros', tags: ['coffee'] },
  'peet': { categoryId: 'dining', subcategoryId: 'dining-coffee', merchant: "Peet's Coffee", tags: ['coffee'] },
  'black rock coffee': { categoryId: 'dining', subcategoryId: 'dining-coffee', merchant: 'Black Rock Coffee', tags: ['coffee'] },
  'coffee bean': { categoryId: 'dining', subcategoryId: 'dining-coffee', merchant: 'Coffee Bean', tags: ['coffee'] },
  'philz': { categoryId: 'dining', subcategoryId: 'dining-coffee', merchant: 'Philz Coffee', tags: ['coffee'] },
  'biggby': { categoryId: 'dining', subcategoryId: 'dining-coffee', merchant: 'Biggby Coffee', tags: ['coffee'] },
  'caribou coffee': { categoryId: 'dining', subcategoryId: 'dining-coffee', merchant: 'Caribou Coffee', tags: ['coffee'] },

  // ── Dining — Fast Food ─────────────────────────────────────────────────────
  'mcdonald': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: "McDonald's", tags: ['fast-food'] },
  'chipotle': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'Chipotle', tags: ['fast-food'] },
  'taco bell': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'Taco Bell', tags: ['fast-food'] },
  'subway': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'Subway', tags: ['fast-food'] },
  'panda express': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'Panda Express', tags: ['fast-food'] },
  'five guys': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'Five Guys', tags: ['fast-food'] },
  'in-n-out': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'In-N-Out', tags: ['fast-food'] },
  'jack in the box': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'Jack in the Box', tags: ['fast-food'] },
  "arby's": { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: "Arby's", tags: ['fast-food'] },
  'arbys': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: "Arby's", tags: ['fast-food'] },
  "wendy's": { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: "Wendy's", tags: ['fast-food'] },
  'wendys': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: "Wendy's", tags: ['fast-food'] },
  'burger king': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'Burger King', tags: ['fast-food'] },
  'popeyes': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'Popeyes', tags: ['fast-food'] },
  'chick-fil-a': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'Chick-fil-A', tags: ['fast-food'] },
  'chick fil a': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'Chick-fil-A', tags: ['fast-food'] },
  'chickfila': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'Chick-fil-A', tags: ['fast-food'] },
  'sonic drive': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'Sonic', tags: ['fast-food'] },
  'sonic #': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'Sonic', tags: ['fast-food'] },
  'dairy queen': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'Dairy Queen', tags: ['fast-food'] },
  'wingstop': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'Wingstop', tags: ['fast-food'] },
  'mod pizza': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'MOD Pizza', tags: ['fast-food'] },
  'papa murphy': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: "Papa Murphy's", tags: ['fast-food'] },
  "jersey mike": { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: "Jersey Mike's", tags: ['fast-food'] },
  'jimmy john': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: "Jimmy John's", tags: ['fast-food'] },
  'raising cane': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: "Raising Cane's", tags: ['fast-food'] },

  // ── Dining — Restaurants ───────────────────────────────────────────────────
  'panera': { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: 'Panera Bread', tags: ['restaurant'] },
  'olive garden': { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: 'Olive Garden', tags: ['restaurant'] },
  'applebee': { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: "Applebee's", tags: ['restaurant'] },
  'red robin': { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: 'Red Robin', tags: ['restaurant'] },
  'buffalo wild': { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: 'Buffalo Wild Wings', tags: ['restaurant'] },
  'ihop': { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: 'IHOP', tags: ['restaurant'] },
  "denny's": { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: "Denny's", tags: ['restaurant'] },
  'dennys': { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: "Denny's", tags: ['restaurant'] },
  'cracker barrel': { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: 'Cracker Barrel', tags: ['restaurant'] },
  'outback': { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: 'Outback Steakhouse', tags: ['restaurant'] },
  'chilis': { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: "Chili's", tags: ['restaurant'] },
  "chili's": { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: "Chili's", tags: ['restaurant'] },
  'pizza hut': { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: 'Pizza Hut', tags: ['restaurant'] },
  "domino's": { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: "Domino's", tags: ['restaurant'] },
  'dominos': { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: "Domino's", tags: ['restaurant'] },
  "papa john": { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: "Papa John's", tags: ['restaurant'] },
  'little caesars': { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: 'Little Caesars', tags: ['restaurant'] },
  // TST* and SQ* prefixes are handled in the AI prompt; include common POS patterns
  'tst*': { categoryId: 'dining', subcategoryId: 'dining-restaurants', merchant: 'Restaurant (Toast POS)', tags: ['restaurant'] },

  // ── Dining — Delivery ──────────────────────────────────────────────────────
  'doordash': { categoryId: 'dining', subcategoryId: 'dining-delivery', merchant: 'DoorDash', tags: ['delivery', 'food-delivery'] },
  'ubereats': { categoryId: 'dining', subcategoryId: 'dining-delivery', merchant: 'Uber Eats', tags: ['delivery', 'food-delivery'] },
  'uber eats': { categoryId: 'dining', subcategoryId: 'dining-delivery', merchant: 'Uber Eats', tags: ['delivery', 'food-delivery'] },
  'grubhub': { categoryId: 'dining', subcategoryId: 'dining-delivery', merchant: 'Grubhub', tags: ['delivery', 'food-delivery'] },
  'instacart': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Instacart', tags: ['grocery', 'delivery'] },

  // ── Transportation — Rideshare ─────────────────────────────────────────────
  // ubereats must appear before uber so substring match works correctly
  'uber': { categoryId: 'transportation', subcategoryId: 'transport-rideshare', merchant: 'Uber', tags: ['rideshare'] },
  'lyft': { categoryId: 'transportation', subcategoryId: 'transport-rideshare', merchant: 'Lyft', tags: ['rideshare'] },

  // ── Transportation — Gas ───────────────────────────────────────────────────
  'exxon': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: 'Exxon', tags: ['gas'] },
  'shell': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: 'Shell', tags: ['gas'] },
  'chevron': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: 'Chevron', tags: ['gas'] },
  'bp ': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: 'BP', tags: ['gas'] },
  'bp#': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: 'BP', tags: ['gas'] },
  'circle k': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: 'Circle K', tags: ['gas'] },
  '76 ': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: 'Phillips 76', tags: ['gas'] },
  'phillips 66': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: 'Phillips 66', tags: ['gas'] },
  'arco': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: 'ARCO', tags: ['gas'] },
  'speedway': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: 'Speedway', tags: ['gas'] },
  'kwik trip': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: 'Kwik Trip', tags: ['gas'] },
  'wawa': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: 'Wawa', tags: ['gas'] },
  'casey': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: "Casey's", tags: ['gas'] },
  'maverik': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: 'Maverik', tags: ['gas'] },
  'love\'s travel': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: "Love's", tags: ['gas'] },

  // ── Transportation — Auto ──────────────────────────────────────────────────
  'jiffy lube': { categoryId: 'transportation', subcategoryId: 'transport-auto', merchant: 'Jiffy Lube', tags: ['auto'] },
  'firestone': { categoryId: 'transportation', subcategoryId: 'transport-auto', merchant: 'Firestone', tags: ['auto'] },
  'pep boys': { categoryId: 'transportation', subcategoryId: 'transport-auto', merchant: 'Pep Boys', tags: ['auto'] },
  'midas': { categoryId: 'transportation', subcategoryId: 'transport-auto', merchant: 'Midas', tags: ['auto'] },
  'autozone': { categoryId: 'transportation', subcategoryId: 'transport-auto', merchant: 'AutoZone', tags: ['auto'] },
  'auto zone': { categoryId: 'transportation', subcategoryId: 'transport-auto', merchant: 'AutoZone', tags: ['auto'] },
  "o'reilly auto": { categoryId: 'transportation', subcategoryId: 'transport-auto', merchant: "O'Reilly Auto Parts", tags: ['auto'] },
  'oreilly auto': { categoryId: 'transportation', subcategoryId: 'transport-auto', merchant: "O'Reilly Auto Parts", tags: ['auto'] },
  'advance auto': { categoryId: 'transportation', subcategoryId: 'transport-auto', merchant: 'Advance Auto Parts', tags: ['auto'] },
  'napa auto': { categoryId: 'transportation', subcategoryId: 'transport-auto', merchant: 'NAPA Auto Parts', tags: ['auto'] },
  'carmax': { categoryId: 'transportation', subcategoryId: 'transport-auto', merchant: 'CarMax', tags: ['auto'] },
  'valvoline': { categoryId: 'transportation', subcategoryId: 'transport-auto', merchant: 'Valvoline', tags: ['auto'] },

  // ── Transportation — Parking & Transit ────────────────────────────────────
  'spothero': { categoryId: 'transportation', subcategoryId: 'transport-parking', merchant: 'SpotHero', tags: ['parking'] },
  'parkwhiz': { categoryId: 'transportation', subcategoryId: 'transport-parking', merchant: 'ParkWhiz', tags: ['parking'] },
  'easypark': { categoryId: 'transportation', subcategoryId: 'transport-parking', merchant: 'EasyPark', tags: ['parking'] },
  'trimet': { categoryId: 'transportation', subcategoryId: 'transport-public', merchant: 'TriMet', tags: ['transit'] },
  'portland streetcar': { categoryId: 'transportation', subcategoryId: 'transport-public', merchant: 'Portland Streetcar', tags: ['transit'] },
  'metro transit': { categoryId: 'transportation', subcategoryId: 'transport-public', merchant: 'Metro Transit', tags: ['transit'] },
  'ezpass': { categoryId: 'transportation', subcategoryId: 'transport-parking', merchant: 'E-ZPass', tags: ['tolls'] },
  'fastrak': { categoryId: 'transportation', subcategoryId: 'transport-parking', merchant: 'FasTrak', tags: ['tolls'] },

  // ── Car Rental ─────────────────────────────────────────────────────────────
  'enterprise rent': { categoryId: 'travel', subcategoryId: 'travel-car-rental', merchant: 'Enterprise', tags: ['car-rental', 'travel'] },
  'hertz': { categoryId: 'travel', subcategoryId: 'travel-car-rental', merchant: 'Hertz', tags: ['car-rental', 'travel'] },
  'avis': { categoryId: 'travel', subcategoryId: 'travel-car-rental', merchant: 'Avis', tags: ['car-rental', 'travel'] },
  'national car': { categoryId: 'travel', subcategoryId: 'travel-car-rental', merchant: 'National Car Rental', tags: ['car-rental', 'travel'] },
  'budget car': { categoryId: 'travel', subcategoryId: 'travel-car-rental', merchant: 'Budget Car Rental', tags: ['car-rental', 'travel'] },
  'alamo': { categoryId: 'travel', subcategoryId: 'travel-car-rental', merchant: 'Alamo', tags: ['car-rental', 'travel'] },
  'turo': { categoryId: 'travel', subcategoryId: 'travel-car-rental', merchant: 'Turo', tags: ['car-rental', 'travel'] },

  // ── Shopping — General ─────────────────────────────────────────────────────
  'target': { categoryId: 'shopping', subcategoryId: 'shopping-general', merchant: 'Target', tags: ['retail'] },
  'walmart': { categoryId: 'shopping', subcategoryId: 'shopping-general', merchant: 'Walmart', tags: ['retail'] },
  'amazon': { categoryId: 'shopping', subcategoryId: 'shopping-amazon', merchant: 'Amazon', tags: ['online', 'amazon'] },
  'amzn': { categoryId: 'shopping', subcategoryId: 'shopping-amazon', merchant: 'Amazon', tags: ['online', 'amazon'] },
  'ebay': { categoryId: 'shopping', subcategoryId: 'shopping-general', merchant: 'eBay', tags: ['online'] },
  'etsy': { categoryId: 'shopping', subcategoryId: 'shopping-general', merchant: 'Etsy', tags: ['online'] },
  'wayfair': { categoryId: 'shopping', subcategoryId: 'shopping-home', merchant: 'Wayfair', tags: ['home'] },
  'ikea': { categoryId: 'shopping', subcategoryId: 'shopping-home', merchant: 'IKEA', tags: ['home'] },
  'home depot': { categoryId: 'shopping', subcategoryId: 'shopping-home', merchant: 'Home Depot', tags: ['home', 'hardware'] },
  "lowe's": { categoryId: 'shopping', subcategoryId: 'shopping-home', merchant: "Lowe's", tags: ['home', 'hardware'] },
  'lowes': { categoryId: 'shopping', subcategoryId: 'shopping-home', merchant: "Lowe's", tags: ['home', 'hardware'] },
  'menards': { categoryId: 'shopping', subcategoryId: 'shopping-home', merchant: 'Menards', tags: ['home', 'hardware'] },
  'ace hardware': { categoryId: 'shopping', subcategoryId: 'shopping-home', merchant: 'Ace Hardware', tags: ['home', 'hardware'] },
  'dollar tree': { categoryId: 'shopping', subcategoryId: 'shopping-general', merchant: 'Dollar Tree', tags: ['retail'] },
  'dollar general': { categoryId: 'shopping', subcategoryId: 'shopping-general', merchant: 'Dollar General', tags: ['retail'] },
  'five below': { categoryId: 'shopping', subcategoryId: 'shopping-general', merchant: 'Five Below', tags: ['retail'] },

  // ── Shopping — Electronics ─────────────────────────────────────────────────
  'apple.com': { categoryId: 'shopping', subcategoryId: 'shopping-electronics', merchant: 'Apple', tags: ['electronics'] },
  'apple store': { categoryId: 'shopping', subcategoryId: 'shopping-electronics', merchant: 'Apple Store', tags: ['electronics'] },
  'best buy': { categoryId: 'shopping', subcategoryId: 'shopping-electronics', merchant: 'Best Buy', tags: ['electronics'] },
  'micro center': { categoryId: 'shopping', subcategoryId: 'shopping-electronics', merchant: 'Micro Center', tags: ['electronics'] },
  'newegg': { categoryId: 'shopping', subcategoryId: 'shopping-electronics', merchant: 'Newegg', tags: ['electronics', 'online'] },
  'b&h photo': { categoryId: 'shopping', subcategoryId: 'shopping-electronics', merchant: 'B&H Photo', tags: ['electronics'] },

  // ── Shopping — Clothing ────────────────────────────────────────────────────
  'nike': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'Nike', tags: ['clothing', 'sports'] },
  'adidas': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'Adidas', tags: ['clothing', 'sports'] },
  'gap': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'Gap', tags: ['clothing'] },
  'old navy': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'Old Navy', tags: ['clothing'] },
  'banana republic': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'Banana Republic', tags: ['clothing'] },
  'h&m': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'H&M', tags: ['clothing'] },
  'zara': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'Zara', tags: ['clothing'] },
  'nordstrom rack': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'Nordstrom Rack', tags: ['clothing'] },
  'nordstrom': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'Nordstrom', tags: ['clothing'] },
  "macy's": { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: "Macy's", tags: ['clothing'] },
  'macys': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: "Macy's", tags: ['clothing'] },
  'tj maxx': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'TJ Maxx', tags: ['clothing'] },
  'tjmaxx': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'TJ Maxx', tags: ['clothing'] },
  'marshalls': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'Marshalls', tags: ['clothing'] },
  'homegoods': { categoryId: 'shopping', subcategoryId: 'shopping-home', merchant: 'HomeGoods', tags: ['home'] },
  'ross ': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'Ross', tags: ['clothing'] },
  "kohl's": { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: "Kohl's", tags: ['clothing'] },
  'kohls': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: "Kohl's", tags: ['clothing'] },
  'burlington': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'Burlington', tags: ['clothing'] },
  'express ': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'Express', tags: ['clothing'] },
  'uniqlo': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'Uniqlo', tags: ['clothing'] },
  'lululemon': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'Lululemon', tags: ['clothing', 'sports'] },
  'patagonia': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'Patagonia', tags: ['clothing', 'outdoor'] },
  'rei ': { categoryId: 'shopping', subcategoryId: 'shopping-clothing', merchant: 'REI', tags: ['clothing', 'outdoor'] },

  // ── Subscriptions — Streaming ──────────────────────────────────────────────
  'netflix': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Netflix', tags: ['streaming', 'subscription', 'recurring'] },
  'spotify': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Spotify', tags: ['streaming', 'subscription', 'recurring'] },
  'hulu': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Hulu', tags: ['streaming', 'subscription', 'recurring'] },
  'disney': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Disney+', tags: ['streaming', 'subscription', 'recurring'] },
  'hbo': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'HBO Max', tags: ['streaming', 'subscription', 'recurring'] },
  'apple tv': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Apple TV+', tags: ['streaming', 'subscription', 'recurring'] },
  'youtube premium': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'YouTube Premium', tags: ['streaming', 'subscription', 'recurring'] },
  'youtube tv': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'YouTube TV', tags: ['streaming', 'subscription', 'recurring'] },
  'paramount': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Paramount+', tags: ['streaming', 'subscription', 'recurring'] },
  'peacock': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Peacock', tags: ['streaming', 'subscription', 'recurring'] },
  'espn+': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'ESPN+', tags: ['streaming', 'subscription', 'recurring'] },
  'fubotv': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'FuboTV', tags: ['streaming', 'subscription', 'recurring'] },
  'sling tv': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Sling TV', tags: ['streaming', 'subscription', 'recurring'] },
  'sling media': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Sling TV', tags: ['streaming', 'subscription', 'recurring'] },
  'tidal': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Tidal', tags: ['streaming', 'subscription', 'recurring'] },
  'apple music': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Apple Music', tags: ['streaming', 'subscription', 'recurring'] },
  'amazon prime': { categoryId: 'subscriptions', subcategoryId: 'subs-membership', merchant: 'Amazon Prime', tags: ['subscription', 'recurring'] },
  'amazon video': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Amazon Video', tags: ['streaming', 'subscription', 'recurring'] },
  'audible': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Audible', tags: ['subscription', 'recurring'] },
  'sirius': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'SiriusXM', tags: ['streaming', 'subscription', 'recurring'] },

  // ── Subscriptions — Software ───────────────────────────────────────────────
  'chatgpt': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'ChatGPT', tags: ['software', 'subscription', 'recurring'] },
  'openai': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'OpenAI', tags: ['software', 'subscription', 'recurring'] },
  'github': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'GitHub', tags: ['software', 'subscription', 'recurring'] },
  'microsoft 365': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Microsoft 365', tags: ['software', 'subscription', 'recurring'] },
  'microsoft': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Microsoft', tags: ['software', 'subscription', 'recurring'] },
  'adobe': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Adobe', tags: ['software', 'subscription', 'recurring'] },
  'dropbox': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Dropbox', tags: ['software', 'subscription', 'recurring'] },
  'icloud': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'iCloud', tags: ['software', 'subscription', 'recurring'] },
  'google one': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Google One', tags: ['software', 'subscription', 'recurring'] },
  'google storage': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Google Storage', tags: ['software', 'subscription', 'recurring'] },
  'google play': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Google Play', tags: ['software', 'subscription'] },
  'google *': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Google', tags: ['software', 'subscription'] },
  'notion': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Notion', tags: ['software', 'subscription', 'recurring'] },
  'figma': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Figma', tags: ['software', 'subscription', 'recurring'] },
  'canva': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Canva', tags: ['software', 'subscription', 'recurring'] },
  'zoom': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Zoom', tags: ['software', 'subscription', 'recurring'] },
  '1password': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: '1Password', tags: ['software', 'subscription', 'recurring'] },
  'bitwarden': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Bitwarden', tags: ['software', 'subscription', 'recurring'] },
  'lastpass': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'LastPass', tags: ['software', 'subscription', 'recurring'] },
  'nordvpn': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'NordVPN', tags: ['software', 'subscription', 'recurring'] },
  'expressvpn': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'ExpressVPN', tags: ['software', 'subscription', 'recurring'] },
  'slack': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Slack', tags: ['software', 'subscription'] },
  'box.com': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Box', tags: ['software', 'subscription'] },
  'evernote': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Evernote', tags: ['software', 'subscription', 'recurring'] },
  'duolingo': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Duolingo', tags: ['software', 'subscription'] },
  'headspace': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Headspace', tags: ['software', 'subscription', 'recurring'] },
  'calm': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Calm', tags: ['software', 'subscription', 'recurring'] },
  'xbox': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Xbox', tags: ['gaming', 'subscription', 'recurring'] },
  'playstation': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'PlayStation', tags: ['gaming', 'subscription'] },
  'nintendo': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'Nintendo', tags: ['gaming', 'subscription'] },
  'steam': { categoryId: 'entertainment', subcategoryId: 'entertainment-games', merchant: 'Steam', tags: ['gaming'] },

  // ── Subscriptions — News ───────────────────────────────────────────────────
  'new york times': { categoryId: 'subscriptions', subcategoryId: 'subs-news', merchant: 'New York Times', tags: ['news', 'subscription', 'recurring'] },
  'nytimes': { categoryId: 'subscriptions', subcategoryId: 'subs-news', merchant: 'New York Times', tags: ['news', 'subscription', 'recurring'] },
  'washington post': { categoryId: 'subscriptions', subcategoryId: 'subs-news', merchant: 'Washington Post', tags: ['news', 'subscription', 'recurring'] },
  'the athletic': { categoryId: 'subscriptions', subcategoryId: 'subs-news', merchant: 'The Athletic', tags: ['news', 'subscription', 'recurring'] },
  'wall street journal': { categoryId: 'subscriptions', subcategoryId: 'subs-news', merchant: 'Wall Street Journal', tags: ['news', 'subscription', 'recurring'] },

  // ── Subscriptions — Memberships ────────────────────────────────────────────
  'costco membership': { categoryId: 'subscriptions', subcategoryId: 'subs-membership', merchant: 'Costco Membership', tags: ['membership', 'recurring'] },
  'sam\'s club': { categoryId: 'subscriptions', subcategoryId: 'subs-membership', merchant: "Sam's Club", tags: ['membership', 'recurring'] },
  'sams club': { categoryId: 'subscriptions', subcategoryId: 'subs-membership', merchant: "Sam's Club", tags: ['membership', 'recurring'] },

  // ── Housing — Utilities ────────────────────────────────────────────────────
  'portland general': { categoryId: 'housing', subcategoryId: 'housing-utilities', merchant: 'Portland General Electric', tags: ['utility', 'electric', 'recurring'] },
  'pge ': { categoryId: 'housing', subcategoryId: 'housing-utilities', merchant: 'Portland General Electric', tags: ['utility', 'electric', 'recurring'] },
  'pacific power': { categoryId: 'housing', subcategoryId: 'housing-utilities', merchant: 'Pacific Power', tags: ['utility', 'electric', 'recurring'] },
  'nw natural': { categoryId: 'housing', subcategoryId: 'housing-utilities', merchant: 'NW Natural', tags: ['utility', 'gas', 'recurring'] },
  'northwest natural': { categoryId: 'housing', subcategoryId: 'housing-utilities', merchant: 'NW Natural', tags: ['utility', 'gas', 'recurring'] },
  'puget sound energy': { categoryId: 'housing', subcategoryId: 'housing-utilities', merchant: 'Puget Sound Energy', tags: ['utility', 'recurring'] },
  'avista': { categoryId: 'housing', subcategoryId: 'housing-utilities', merchant: 'Avista Utilities', tags: ['utility', 'recurring'] },
  'pg&e': { categoryId: 'housing', subcategoryId: 'housing-utilities', merchant: 'PG&E', tags: ['utility', 'recurring'] },
  'con edison': { categoryId: 'housing', subcategoryId: 'housing-utilities', merchant: 'Con Edison', tags: ['utility', 'recurring'] },
  'national grid': { categoryId: 'housing', subcategoryId: 'housing-utilities', merchant: 'National Grid', tags: ['utility', 'recurring'] },
  'dominion energy': { categoryId: 'housing', subcategoryId: 'housing-utilities', merchant: 'Dominion Energy', tags: ['utility', 'recurring'] },
  'duke energy': { categoryId: 'housing', subcategoryId: 'housing-utilities', merchant: 'Duke Energy', tags: ['utility', 'recurring'] },
  'southern company': { categoryId: 'housing', subcategoryId: 'housing-utilities', merchant: 'Southern Company', tags: ['utility', 'recurring'] },
  'xcel energy': { categoryId: 'housing', subcategoryId: 'housing-utilities', merchant: 'Xcel Energy', tags: ['utility', 'recurring'] },
  'city of portland': { categoryId: 'housing', subcategoryId: 'housing-utilities', merchant: 'City of Portland', tags: ['utility', 'water', 'recurring'] },
  'portland water': { categoryId: 'housing', subcategoryId: 'housing-utilities', merchant: 'Portland Water Bureau', tags: ['utility', 'water', 'recurring'] },

  // ── Housing — Internet & Phone ─────────────────────────────────────────────
  'comcast': { categoryId: 'housing', subcategoryId: 'housing-internet', merchant: 'Comcast/Xfinity', tags: ['internet', 'recurring'] },
  'xfinity': { categoryId: 'housing', subcategoryId: 'housing-internet', merchant: 'Xfinity', tags: ['internet', 'recurring'] },
  'spectrum': { categoryId: 'housing', subcategoryId: 'housing-internet', merchant: 'Spectrum', tags: ['internet', 'recurring'] },
  'at&t': { categoryId: 'housing', subcategoryId: 'housing-internet', merchant: 'AT&T', tags: ['phone', 'internet', 'recurring'] },
  'verizon': { categoryId: 'housing', subcategoryId: 'housing-internet', merchant: 'Verizon', tags: ['phone', 'recurring'] },
  't-mobile': { categoryId: 'housing', subcategoryId: 'housing-internet', merchant: 'T-Mobile', tags: ['phone', 'recurring'] },
  'tmobile': { categoryId: 'housing', subcategoryId: 'housing-internet', merchant: 'T-Mobile', tags: ['phone', 'recurring'] },
  'cox communications': { categoryId: 'housing', subcategoryId: 'housing-internet', merchant: 'Cox', tags: ['internet', 'recurring'] },
  'centurylink': { categoryId: 'housing', subcategoryId: 'housing-internet', merchant: 'CenturyLink', tags: ['internet', 'recurring'] },
  'lumen': { categoryId: 'housing', subcategoryId: 'housing-internet', merchant: 'Lumen', tags: ['internet', 'recurring'] },
  'frontier communications': { categoryId: 'housing', subcategoryId: 'housing-internet', merchant: 'Frontier', tags: ['internet', 'recurring'] },
  'ziply': { categoryId: 'housing', subcategoryId: 'housing-internet', merchant: 'Ziply Fiber', tags: ['internet', 'recurring'] },
  'google fiber': { categoryId: 'housing', subcategoryId: 'housing-internet', merchant: 'Google Fiber', tags: ['internet', 'recurring'] },
  'mint mobile': { categoryId: 'housing', subcategoryId: 'housing-internet', merchant: 'Mint Mobile', tags: ['phone', 'recurring'] },
  'boost mobile': { categoryId: 'housing', subcategoryId: 'housing-internet', merchant: 'Boost Mobile', tags: ['phone', 'recurring'] },
  'cricket wireless': { categoryId: 'housing', subcategoryId: 'housing-internet', merchant: 'Cricket Wireless', tags: ['phone', 'recurring'] },

  // ── Housing — Mortgage/Rent ────────────────────────────────────────────────
  'mortgage': { categoryId: 'housing', subcategoryId: 'housing-rent', merchant: 'Mortgage Payment', tags: ['mortgage', 'recurring'] },
  'wells fargo home': { categoryId: 'housing', subcategoryId: 'housing-rent', merchant: 'Wells Fargo Mortgage', tags: ['mortgage', 'recurring'] },
  'mr. cooper': { categoryId: 'housing', subcategoryId: 'housing-rent', merchant: 'Mr. Cooper Mortgage', tags: ['mortgage', 'recurring'] },
  'loancare': { categoryId: 'housing', subcategoryId: 'housing-rent', merchant: 'LoanCare', tags: ['mortgage', 'recurring'] },
  'pennymac': { categoryId: 'housing', subcategoryId: 'housing-rent', merchant: 'PennyMac', tags: ['mortgage', 'recurring'] },
  'newrez': { categoryId: 'housing', subcategoryId: 'housing-rent', merchant: 'NewRez', tags: ['mortgage', 'recurring'] },

  // ── Insurance ──────────────────────────────────────────────────────────────
  'state farm': { categoryId: 'housing', subcategoryId: 'housing-insurance', merchant: 'State Farm', tags: ['insurance', 'recurring'] },
  'geico': { categoryId: 'transportation', subcategoryId: 'transport-auto', merchant: 'GEICO', tags: ['insurance', 'recurring'] },
  'progressive': { categoryId: 'transportation', subcategoryId: 'transport-auto', merchant: 'Progressive', tags: ['insurance', 'recurring'] },
  'allstate': { categoryId: 'housing', subcategoryId: 'housing-insurance', merchant: 'Allstate', tags: ['insurance', 'recurring'] },
  'farmers': { categoryId: 'housing', subcategoryId: 'housing-insurance', merchant: 'Farmers Insurance', tags: ['insurance', 'recurring'] },
  'usaa': { categoryId: 'housing', subcategoryId: 'housing-insurance', merchant: 'USAA', tags: ['insurance', 'recurring'] },
  'liberty mutual': { categoryId: 'housing', subcategoryId: 'housing-insurance', merchant: 'Liberty Mutual', tags: ['insurance', 'recurring'] },
  'nationwide': { categoryId: 'housing', subcategoryId: 'housing-insurance', merchant: 'Nationwide', tags: ['insurance', 'recurring'] },
  'aaa ': { categoryId: 'transportation', subcategoryId: 'transport-auto', merchant: 'AAA', tags: ['insurance', 'membership', 'recurring'] },
  'lemonade': { categoryId: 'housing', subcategoryId: 'housing-insurance', merchant: 'Lemonade', tags: ['insurance', 'recurring'] },
  'root insurance': { categoryId: 'transportation', subcategoryId: 'transport-auto', merchant: 'Root Insurance', tags: ['insurance', 'recurring'] },
  'metlife': { categoryId: 'health', subcategoryId: 'health-insurance', merchant: 'MetLife', tags: ['insurance', 'recurring'] },

  // ── Health — Pharmacy ──────────────────────────────────────────────────────
  'cvs': { categoryId: 'health', subcategoryId: 'health-pharmacy', merchant: 'CVS', tags: ['pharmacy'] },
  'walgreens': { categoryId: 'health', subcategoryId: 'health-pharmacy', merchant: 'Walgreens', tags: ['pharmacy'] },
  'rite aid': { categoryId: 'health', subcategoryId: 'health-pharmacy', merchant: 'Rite Aid', tags: ['pharmacy'] },
  'bartell': { categoryId: 'health', subcategoryId: 'health-pharmacy', merchant: 'Bartell Drugs', tags: ['pharmacy'] },
  'goodrx': { categoryId: 'health', subcategoryId: 'health-pharmacy', merchant: 'GoodRx', tags: ['pharmacy'] },

  // ── Health — Medical ───────────────────────────────────────────────────────
  'kaiser': { categoryId: 'health', subcategoryId: 'health-medical', merchant: 'Kaiser Permanente', tags: ['medical', 'recurring'] },
  'providence': { categoryId: 'health', subcategoryId: 'health-medical', merchant: 'Providence', tags: ['medical'] },
  'ohsu': { categoryId: 'health', subcategoryId: 'health-medical', merchant: 'OHSU', tags: ['medical'] },
  'legacy health': { categoryId: 'health', subcategoryId: 'health-medical', merchant: 'Legacy Health', tags: ['medical'] },
  'one medical': { categoryId: 'health', subcategoryId: 'health-medical', merchant: 'One Medical', tags: ['medical', 'subscription'] },
  'cigna': { categoryId: 'health', subcategoryId: 'health-insurance', merchant: 'Cigna', tags: ['insurance', 'recurring'] },
  'aetna': { categoryId: 'health', subcategoryId: 'health-insurance', merchant: 'Aetna', tags: ['insurance', 'recurring'] },
  'blue cross': { categoryId: 'health', subcategoryId: 'health-insurance', merchant: 'Blue Cross Blue Shield', tags: ['insurance', 'recurring'] },
  'bcbs': { categoryId: 'health', subcategoryId: 'health-insurance', merchant: 'Blue Cross Blue Shield', tags: ['insurance', 'recurring'] },
  'united healthcare': { categoryId: 'health', subcategoryId: 'health-insurance', merchant: 'United Healthcare', tags: ['insurance', 'recurring'] },
  'humana': { categoryId: 'health', subcategoryId: 'health-insurance', merchant: 'Humana', tags: ['insurance', 'recurring'] },
  'dental': { categoryId: 'health', subcategoryId: 'health-medical', merchant: 'Dental', tags: ['medical'] },
  'vision': { categoryId: 'health', subcategoryId: 'health-medical', merchant: 'Vision', tags: ['medical'] },
  'optometrist': { categoryId: 'health', subcategoryId: 'health-medical', merchant: 'Optometrist', tags: ['medical'] },
  'labcorp': { categoryId: 'health', subcategoryId: 'health-medical', merchant: 'LabCorp', tags: ['medical'] },
  'quest diagnostics': { categoryId: 'health', subcategoryId: 'health-medical', merchant: 'Quest Diagnostics', tags: ['medical'] },

  // ── Health — Fitness ───────────────────────────────────────────────────────
  'planet fitness': { categoryId: 'health', subcategoryId: 'health-fitness', merchant: 'Planet Fitness', tags: ['gym', 'subscription', 'recurring'] },
  'equinox': { categoryId: 'health', subcategoryId: 'health-fitness', merchant: 'Equinox', tags: ['gym', 'subscription', 'recurring'] },
  'peloton': { categoryId: 'health', subcategoryId: 'health-fitness', merchant: 'Peloton', tags: ['fitness', 'subscription', 'recurring'] },
  '24 hour fitness': { categoryId: 'health', subcategoryId: 'health-fitness', merchant: '24 Hour Fitness', tags: ['gym', 'subscription', 'recurring'] },
  'la fitness': { categoryId: 'health', subcategoryId: 'health-fitness', merchant: 'LA Fitness', tags: ['gym', 'subscription', 'recurring'] },
  'ymca': { categoryId: 'health', subcategoryId: 'health-fitness', merchant: 'YMCA', tags: ['gym', 'subscription', 'recurring'] },
  'anytime fitness': { categoryId: 'health', subcategoryId: 'health-fitness', merchant: 'Anytime Fitness', tags: ['gym', 'subscription', 'recurring'] },
  'crossfit': { categoryId: 'health', subcategoryId: 'health-fitness', merchant: 'CrossFit', tags: ['gym', 'subscription', 'recurring'] },
  'orangetheory': { categoryId: 'health', subcategoryId: 'health-fitness', merchant: 'Orangetheory Fitness', tags: ['gym', 'subscription', 'recurring'] },
  'noom': { categoryId: 'health', subcategoryId: 'health-fitness', merchant: 'Noom', tags: ['fitness', 'subscription', 'recurring'] },
  'weight watchers': { categoryId: 'health', subcategoryId: 'health-fitness', merchant: 'Weight Watchers', tags: ['fitness', 'subscription', 'recurring'] },
  'beachbody': { categoryId: 'health', subcategoryId: 'health-fitness', merchant: 'Beachbody', tags: ['fitness', 'subscription', 'recurring'] },
  'strava': { categoryId: 'health', subcategoryId: 'health-fitness', merchant: 'Strava', tags: ['fitness', 'subscription', 'recurring'] },

  // ── Travel ─────────────────────────────────────────────────────────────────
  'airbnb': { categoryId: 'travel', subcategoryId: 'travel-hotels', merchant: 'Airbnb', tags: ['travel', 'lodging'] },
  'vrbo': { categoryId: 'travel', subcategoryId: 'travel-hotels', merchant: 'VRBO', tags: ['travel', 'lodging'] },
  'marriott': { categoryId: 'travel', subcategoryId: 'travel-hotels', merchant: 'Marriott', tags: ['travel', 'lodging'] },
  'hilton': { categoryId: 'travel', subcategoryId: 'travel-hotels', merchant: 'Hilton', tags: ['travel', 'lodging'] },
  'hyatt': { categoryId: 'travel', subcategoryId: 'travel-hotels', merchant: 'Hyatt', tags: ['travel', 'lodging'] },
  'ihg': { categoryId: 'travel', subcategoryId: 'travel-hotels', merchant: 'IHG Hotels', tags: ['travel', 'lodging'] },
  'holiday inn': { categoryId: 'travel', subcategoryId: 'travel-hotels', merchant: 'Holiday Inn', tags: ['travel', 'lodging'] },
  'hampton inn': { categoryId: 'travel', subcategoryId: 'travel-hotels', merchant: 'Hampton Inn', tags: ['travel', 'lodging'] },
  'best western': { categoryId: 'travel', subcategoryId: 'travel-hotels', merchant: 'Best Western', tags: ['travel', 'lodging'] },
  'expedia': { categoryId: 'travel', subcategoryId: 'travel-hotels', merchant: 'Expedia', tags: ['travel'] },
  'booking.com': { categoryId: 'travel', subcategoryId: 'travel-hotels', merchant: 'Booking.com', tags: ['travel'] },
  'hotels.com': { categoryId: 'travel', subcategoryId: 'travel-hotels', merchant: 'Hotels.com', tags: ['travel'] },
  'delta': { categoryId: 'travel', subcategoryId: 'travel-flights', merchant: 'Delta Airlines', tags: ['travel', 'flight'] },
  'united': { categoryId: 'travel', subcategoryId: 'travel-flights', merchant: 'United Airlines', tags: ['travel', 'flight'] },
  'american airlines': { categoryId: 'travel', subcategoryId: 'travel-flights', merchant: 'American Airlines', tags: ['travel', 'flight'] },
  'southwest': { categoryId: 'travel', subcategoryId: 'travel-flights', merchant: 'Southwest Airlines', tags: ['travel', 'flight'] },
  'alaska airlines': { categoryId: 'travel', subcategoryId: 'travel-flights', merchant: 'Alaska Airlines', tags: ['travel', 'flight'] },
  'jetblue': { categoryId: 'travel', subcategoryId: 'travel-flights', merchant: 'JetBlue', tags: ['travel', 'flight'] },
  'spirit airlines': { categoryId: 'travel', subcategoryId: 'travel-flights', merchant: 'Spirit Airlines', tags: ['travel', 'flight'] },
  'frontier airlines': { categoryId: 'travel', subcategoryId: 'travel-flights', merchant: 'Frontier Airlines', tags: ['travel', 'flight'] },

  // ── Savings & Investments ──────────────────────────────────────────────────
  'fidelity': { categoryId: 'savings', subcategoryId: 'savings-brokerage', merchant: 'Fidelity', tags: ['investment', 'recurring'] },
  'vanguard': { categoryId: 'savings', subcategoryId: 'savings-brokerage', merchant: 'Vanguard', tags: ['investment', 'recurring'] },
  'charles schwab': { categoryId: 'savings', subcategoryId: 'savings-brokerage', merchant: 'Charles Schwab', tags: ['investment'] },
  'schwab': { categoryId: 'savings', subcategoryId: 'savings-brokerage', merchant: 'Charles Schwab', tags: ['investment'] },
  'robinhood': { categoryId: 'savings', subcategoryId: 'savings-brokerage', merchant: 'Robinhood', tags: ['investment'] },
  'betterment': { categoryId: 'savings', subcategoryId: 'savings-brokerage', merchant: 'Betterment', tags: ['investment', 'recurring'] },
  'wealthfront': { categoryId: 'savings', subcategoryId: 'savings-brokerage', merchant: 'Wealthfront', tags: ['investment', 'recurring'] },
  'acorns': { categoryId: 'savings', subcategoryId: 'savings-brokerage', merchant: 'Acorns', tags: ['investment', 'recurring'] },
  'coinbase': { categoryId: 'savings', subcategoryId: 'savings-brokerage', merchant: 'Coinbase', tags: ['crypto'] },
  'high yield savings': { categoryId: 'savings', subcategoryId: 'savings-savings-account', merchant: 'High Yield Savings', tags: ['savings'] },

  // ── Education ──────────────────────────────────────────────────────────────
  'udemy': { categoryId: 'education', subcategoryId: 'edu-courses', merchant: 'Udemy', tags: ['education', 'subscription'] },
  'coursera': { categoryId: 'education', subcategoryId: 'edu-courses', merchant: 'Coursera', tags: ['education', 'subscription'] },
  'linkedin learning': { categoryId: 'education', subcategoryId: 'edu-courses', merchant: 'LinkedIn Learning', tags: ['education', 'subscription', 'recurring'] },
  'skillshare': { categoryId: 'education', subcategoryId: 'edu-courses', merchant: 'Skillshare', tags: ['education', 'subscription', 'recurring'] },
  'pluralsight': { categoryId: 'education', subcategoryId: 'edu-courses', merchant: 'Pluralsight', tags: ['education', 'subscription', 'recurring'] },
  'codecademy': { categoryId: 'education', subcategoryId: 'edu-courses', merchant: 'Codecademy', tags: ['education', 'subscription'] },
  'khan academy': { categoryId: 'education', subcategoryId: 'edu-courses', merchant: 'Khan Academy', tags: ['education'] },
  'chegg': { categoryId: 'education', subcategoryId: 'edu-books', merchant: 'Chegg', tags: ['education', 'subscription'] },

  // ── Pets ───────────────────────────────────────────────────────────────────
  'chewy': { categoryId: 'pets', subcategoryId: 'pets-food', merchant: 'Chewy', tags: ['pets', 'recurring'] },
  'petsmart': { categoryId: 'pets', subcategoryId: 'pets-food', merchant: 'PetSmart', tags: ['pets'] },
  'petco': { categoryId: 'pets', subcategoryId: 'pets-food', merchant: 'Petco', tags: ['pets'] },
  'banfield': { categoryId: 'pets', subcategoryId: 'pets-vet', merchant: 'Banfield Pet Hospital', tags: ['pets', 'vet'] },
  'vca ': { categoryId: 'pets', subcategoryId: 'pets-vet', merchant: 'VCA Animal Hospital', tags: ['pets', 'vet'] },
  'pet insurance': { categoryId: 'pets', subcategoryId: 'pets-vet', merchant: 'Pet Insurance', tags: ['pets', 'insurance', 'recurring'] },

  // ── Transfers / Payments ───────────────────────────────────────────────────
  'venmo': { categoryId: 'transfer', subcategoryId: 'transfer-internal', merchant: 'Venmo', tags: ['transfer', 'p2p'] },
  'zelle': { categoryId: 'transfer', subcategoryId: 'transfer-internal', merchant: 'Zelle', tags: ['transfer', 'p2p'] },
  'paypal': { categoryId: 'transfer', subcategoryId: 'transfer-internal', merchant: 'PayPal', tags: ['transfer', 'p2p'] },
  'cash app': { categoryId: 'transfer', subcategoryId: 'transfer-internal', merchant: 'Cash App', tags: ['transfer', 'p2p'] },
  'apple cash': { categoryId: 'transfer', subcategoryId: 'transfer-internal', merchant: 'Apple Cash', tags: ['transfer', 'p2p'] },
  'google pay': { categoryId: 'transfer', subcategoryId: 'transfer-internal', merchant: 'Google Pay', tags: ['transfer', 'p2p'] },
  'online payment': { categoryId: 'transfer', subcategoryId: 'transfer-payment', merchant: 'Credit Card Payment', tags: ['transfer', 'payment'] },
  'autopay': { categoryId: 'transfer', subcategoryId: 'transfer-payment', merchant: 'Auto Payment', tags: ['transfer', 'payment'] },
  'credit card payment': { categoryId: 'transfer', subcategoryId: 'transfer-payment', merchant: 'Credit Card Payment', tags: ['transfer', 'payment'] },
  'card payment': { categoryId: 'transfer', subcategoryId: 'transfer-payment', merchant: 'Card Payment', tags: ['transfer', 'payment'] },
  'epayment': { categoryId: 'transfer', subcategoryId: 'transfer-payment', merchant: 'Electronic Payment', tags: ['transfer', 'payment'] },

  // ── Income ─────────────────────────────────────────────────────────────────
  'direct deposit': { categoryId: 'income', subcategoryId: 'income-salary', merchant: 'Direct Deposit', tags: ['income', 'payroll'] },
  'payroll': { categoryId: 'income', subcategoryId: 'income-salary', merchant: 'Payroll', tags: ['income', 'payroll'] },
  'ach credit': { categoryId: 'income', subcategoryId: 'income-salary', merchant: 'ACH Credit', tags: ['income'] },
  'tax refund': { categoryId: 'income', subcategoryId: 'income-other', merchant: 'Tax Refund', tags: ['income'] },
  'irs treas': { categoryId: 'income', subcategoryId: 'income-other', merchant: 'IRS Tax Refund', tags: ['income'] },

  // ── Kids & Family ──────────────────────────────────────────────────────────
  'kid to kid': { categoryId: 'childcare', subcategoryId: 'kids-supplies', merchant: 'Kid to Kid', tags: ['kids'] },
  'learning express': { categoryId: 'childcare', subcategoryId: 'kids-activities', merchant: 'Learning Express', tags: ['kids'] },
  'pottery barn kids': { categoryId: 'childcare', subcategoryId: 'kids-supplies', merchant: 'Pottery Barn Kids', tags: ['kids'] },
  'carter': { categoryId: 'childcare', subcategoryId: 'kids-supplies', merchant: "Carter's", tags: ['kids', 'clothing'] },
  'children\'s place': { categoryId: 'childcare', subcategoryId: 'kids-supplies', merchant: "Children's Place", tags: ['kids', 'clothing'] },
  'buy buy baby': { categoryId: 'childcare', subcategoryId: 'kids-supplies', merchant: 'buybuy BABY', tags: ['kids'] },
};

export function merchantLookup(description: string): CategorizationResult | null {
  const lower = description.toLowerCase();
  for (const [key, value] of Object.entries(MERCHANT_LOOKUP)) {
    if (lower.includes(key)) {
      return {
        id: '',
        categoryId: value.categoryId,
        subcategoryId: value.subcategoryId,
        normalizedMerchant: value.merchant,
        confidence: 0.95,
        tags: value.tags,
      };
    }
  }
  return null;
}

export function splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

export function applyCategorizationResults(
  transactions: Transaction[],
  results: CategorizationResult[]
): Transaction[] {
  const resultMap = Object.fromEntries(results.map((r) => [r.id, r]));
  return transactions.map((t) => {
    const r = resultMap[t.id];
    if (!r) return t;
    return {
      ...t,
      categoryId: r.categoryId,
      subcategoryId: r.subcategoryId,
      normalizedMerchant: r.normalizedMerchant || t.description,
      confidence: r.confidence,
      tags: r.tags,
    };
  });
}
