import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import AppLayout from '../components/layout/AppLayout';
import { Card, Button, Input, Badge, Spinner } from '../components/ui/DesignSystem';
import { useCart } from '../contexts/CartContext';
import { listProducts, listCategories } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Search, Filter, ShoppingCart, Tag, Package } from 'lucide-react';

export default function Marketplace() {
  const { addItem } = useCart();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { category, search }],
    queryFn: () => listProducts({ category: category || undefined, search: search || undefined }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  });

  const products = productsData?.products || [];
  const categories = categoriesData?.categories || [];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8" data-testid="marketplace">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Digital <span className="text-gradient-primary">Marketplace</span>
            </h1>
            <p className="text-gray-400">Premium trading tools, software, and digital assets</p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12"
              data-testid="search-input"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Button
            variant={category === '' ? 'primary' : 'glass'}
            size="sm"
            onClick={() => setCategory('')}
            data-testid="filter-all"
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={category === cat.slug ? 'primary' : 'glass'}
              size="sm"
              onClick={() => setCategory(cat.slug)}
              data-testid={`filter-${cat.slug}`}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  hover3d
                  className="h-full flex flex-col overflow-hidden group"
                  data-testid={`product-card-${product.id}`}
                >
                  {/* Image */}
                  <div className="relative h-48 -mx-6 -mt-6 mb-4 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {product.isDigital && (
                        <Badge className="bg-purple-500/80 text-white border-0">Digital</Badge>
                      )}
                      {product.salePrice && (
                        <Badge className="bg-red-500/80 text-white border-0">Sale</Badge>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col">
                    <Badge variant="outline" className="self-start mb-2 text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {product.category}
                    </Badge>
                    
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                      {product.name}
                    </h3>
                    
                    {product.description && (
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{product.description}</p>
                    )}

                    <div className="mt-auto flex items-end justify-between">
                      <div>
                        {product.salePrice ? (
                          <div>
                            <span className="text-gray-500 line-through text-sm mr-2">
                              {formatCurrency(product.price)}
                            </span>
                            <span className="text-xl font-bold text-cyan-400">
                              {formatCurrency(product.salePrice)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xl font-bold text-cyan-400">
                            {formatCurrency(product.price)}
                          </span>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => addItem(product, 'product')}
                        data-testid={`add-to-cart-${product.id}`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
