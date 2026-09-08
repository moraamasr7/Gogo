import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Product } from '@/types/database';
import ProductsClient from './ProductsClient';

export const revalidate = 0;

export default async function AdminProductsPage() {
  const supabase = createClient();

  const { data: productsData } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  const products: Product[] = productsData || [];

  return (
    <div className="space-y-6">
      <ProductsClient initialProducts={products} />
    </div>
  );
}
