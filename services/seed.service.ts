import { createProduct } from '@/services/product.service';
import { createSeller } from '@/services/seller.service';
import { Location } from '@/types';

// Utility to generate a random integer in [min, max]
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const SELLER_TEMPLATES = [
  {
    businessName: 'Cozy Knits',
    description: 'Handmade scarves, hats, and cozy winter wear.',
    categories: ['Knitting', 'Winter'],
    emoji: '🧶',
    products: [
      { name: 'Wool Scarf', category: 'Scarf', price: 25, emoji: '🧣' },
      { name: 'Beanie Hat', category: 'Hat', price: 18, emoji: '🧢' },
      { name: 'Mittens', category: 'Gloves', price: 15, emoji: '🧤' },
    ],
  },
  {
    businessName: 'Clay & Kiln',
    description: 'Small-batch pottery and ceramic mugs.',
    categories: ['Pottery', 'Home'],
    emoji: '🏺',
    products: [
      { name: 'Ceramic Mug', category: 'Mug', price: 20, emoji: '☕' },
      { name: 'Plant Pot', category: 'Planter', price: 22, emoji: '🪴' },
      { name: 'Serving Bowl', category: 'Bowl', price: 28, emoji: '🍲' },
    ],
  },
  {
    businessName: 'Woodland Works',
    description: 'Handcrafted wooden décor and boards.',
    categories: ['Woodworking', 'Home'],
    emoji: '🪵',
    products: [
      { name: 'Charcuterie Board', category: 'Kitchen', price: 35, emoji: '🧀' },
      { name: 'Candle Holder', category: 'Décor', price: 16, emoji: '🕯️' },
      { name: 'Coasters (Set of 4)', category: 'Kitchen', price: 14, emoji: '🧩' },
    ],
  },
  {
    businessName: 'Garden & Dye',
    description: 'Naturally dyed textiles and totes.',
    categories: ['Textiles', 'Eco'],
    emoji: '🌿',
    products: [
      { name: 'Dyed Tote Bag', category: 'Bag', price: 24, emoji: '👜' },
      { name: 'Tea Towel', category: 'Kitchen', price: 12, emoji: '🧻' },
      { name: 'Bandana', category: 'Accessory', price: 10, emoji: '🎗️' },
    ],
  },
  {
    businessName: 'Paper Petals',
    description: 'Paper flowers and handmade cards.',
    categories: ['Paper', 'Gifts'],
    emoji: '🌸',
    products: [
      { name: 'Rose Bouquet', category: 'Flowers', price: 30, emoji: '🌹' },
      { name: 'Greeting Card', category: 'Card', price: 6, emoji: '💌' },
      { name: 'Gift Tag Set', category: 'Stationery', price: 8, emoji: '🏷️' },
    ],
  },
];

export async function seedDemoData(center?: Location) {
  // Default center around a generic lat/lon if not provided
  const base: Location =
    center || {
      latitude: 37.7749,
      longitude: -122.4194,
      city: 'San Francisco',
      state: 'CA',
      address: 'San Francisco, CA',
      zipCode: '94103',
    };

  const createdSellerIds: string[] = [];

  for (let i = 0; i < SELLER_TEMPLATES.length; i++) {
    const t = SELLER_TEMPLATES[i];
    const sellerId = `seed_seller_${Date.now()}_${i}`;
    const jitterLat = base.latitude + (Math.random() - 0.5) * 0.05;
    const jitterLon = base.longitude + (Math.random() - 0.5) * 0.05;

    // Build location object without undefined fields (Firestore disallows undefined)
    const loc: any = {
      latitude: jitterLat,
      longitude: jitterLon,
    };
    if (base.address) loc.address = base.address;
    if (base.city) loc.city = base.city;
    if (base.state) loc.state = base.state;
    if (base.zipCode) loc.zipCode = base.zipCode;

    await createSeller(sellerId, {
      userId: `seed_user_${i + 1}`,
      businessName: t.businessName,
      description: t.description,
      location: loc,
      categories: t.categories,
    });

    createdSellerIds.push(sellerId);

    // Create products for this seller
    for (const p of t.products) {
      await createProduct({
        sellerId,
        name: p.name,
        description: `${t.businessName} • ${p.category}`,
        price: p.price,
        category: p.category,
        images: [],
        inStock: true,
        quantity: rand(3, 20),
        emoji: p.emoji,
        tags: t.categories,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return createdSellerIds;
}


