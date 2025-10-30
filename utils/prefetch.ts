import { prefetchImages } from '@/components/ui/lazy-image';
import { getAllProducts, getProductsBySeller } from '@/services/product.service';
import { getNearbySellers } from '@/services/seller.service';
import { Location } from '@/types';

export async function prefetchBuyerHomeAssets(params: { location?: Location; radiusMiles?: number }) {
  try {
    const urls: string[] = [];

    // Recent products (global) - warm cache a bit for the buyer
    const recent = await getAllProducts(undefined, 20);
    recent.forEach((p) => {
      if (p.images && p.images[0]) urls.push(p.images[0]);
    });

    // If we have location, get nearby sellers and prefetch avatars
    if (params.location && params.radiusMiles) {
      const sellers = await getNearbySellers(params.location, params.radiusMiles, 20);
      sellers.forEach((s) => {
        if (s.avatar) urls.push(s.avatar);
      });
    }

    if (urls.length > 0) await prefetchImages(urls);
  } catch {}
}

export async function prefetchSellerDetailAssets(sellerId: string) {
  try {
    const products = await getProductsBySeller(sellerId);
    const urls = products.map((p) => p.images?.[0]).filter(Boolean) as string[];
    if (urls.length > 0) await prefetchImages(urls);
  } catch {}
}


