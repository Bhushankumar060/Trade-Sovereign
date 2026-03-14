import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import AppLayout from '../components/layout/AppLayout';
import { Card, Button, Badge, Spinner } from '../components/ui/DesignSystem';
import { useCart } from '../contexts/CartContext';
import { listMedia } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Music, Film, ShoppingCart, Play } from 'lucide-react';

export default function MediaStore() {
  const { addItem } = useCart();
  const [type, setType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['media', { type }],
    queryFn: () => listMedia({ type: type || undefined }),
  });

  const items = data?.items || [];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8" data-testid="media-store">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Media <span className="text-gradient-primary">Store</span>
            </h1>
            <p className="text-gray-400">Premium courses, music, and digital content</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8">
          <Button
            variant={type === '' ? 'primary' : 'glass'}
            size="sm"
            onClick={() => setType('')}
          >
            All
          </Button>
          <Button
            variant={type === 'music' ? 'primary' : 'glass'}
            size="sm"
            onClick={() => setType('music')}
          >
            <Music className="w-4 h-4 mr-2" />
            Music
          </Button>
          <Button
            variant={type === 'movie' ? 'primary' : 'glass'}
            size="sm"
            onClick={() => setType('movie')}
          >
            <Film className="w-4 h-4 mr-2" />
            Courses
          </Button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Play className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No media items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card hover3d className="h-full flex flex-col overflow-hidden group">
                  {/* Image */}
                  <div className="relative h-48 -mx-6 -mt-6 mb-4 overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        {item.type === 'music' ? (
                          <Music className="w-12 h-12 text-gray-600" />
                        ) : (
                          <Film className="w-12 h-12 text-gray-600" />
                        )}
                      </div>
                    )}
                    
                    <div className="absolute top-3 left-3">
                      <Badge className={item.type === 'music' ? 'bg-purple-500/80 text-white border-0' : 'bg-pink-500/80 text-white border-0'}>
                        {item.type === 'music' ? 'Music' : 'Course'}
                      </Badge>
                    </div>

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-cyan-400/90 flex items-center justify-center">
                        <Play className="w-8 h-8 text-black ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col">
                    <h3 className="font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                      {item.title}
                    </h3>
                    
                    {item.description && (
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{item.description}</p>
                    )}

                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-xl font-bold text-cyan-400">
                        {formatCurrency(item.price)}
                      </span>
                      
                      <Button
                        size="sm"
                        onClick={() => addItem({ ...item, name: item.title }, 'media')}
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
