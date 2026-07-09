'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import Link from 'next/link';
import { Filter, Star, ChevronLeft, ChevronRight, SlidersHorizontal, AlertCircle, CheckCircle } from 'lucide-react';

function ProductsCatalog() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters State
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [page, setPage] = useState(1);

  // Sync search input with query params
  useEffect(() => {
    setSearchVal(searchParams.get('search') || '');
    setPage(1);
  }, [searchParams]);

  // 1. Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/products/categories').then((res) => res.data.categories),
  });

  // 2. Fetch Products Catalog
  const { data: prodData, isLoading, refetch } = useQuery({
    queryKey: [
      'products-list',
      searchVal,
      selectedCategory,
      selectedBrand,
      minPrice,
      maxPrice,
      minRating,
      selectedSort,
      page,
    ],
    queryFn: () =>
      api
        .get('/products/list', {
          params: {
            search: searchVal || undefined,
            category: selectedCategory || undefined,
            brand: selectedBrand || undefined,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            rating: minRating || undefined,
            sort: selectedSort,
            page,
            limit: 6,
          },
        })
        .then((res) => res.data),
  });

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setSelectedSort('newest');
    setPage(1);
    router.push('/products');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* SIDEBAR FILTERS - Amazon style */}
        <aside className="w-full lg:w-60 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg h-fit space-y-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-2.5">
            <span className="font-black text-xs flex items-center gap-1.5 uppercase tracking-wider text-slate-700 dark:text-slate-200">
              <Filter className="h-4 w-4 text-orange-500" />
              <span>Filters</span>
            </span>
            <button onClick={clearFilters} className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline">
              Clear All
            </button>
          </div>

          {/* Category List */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Category</h4>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-md px-3 py-2 text-xs font-bold cursor-pointer"
            >
              <option value="">All Departments</option>
              {categories?.map((cat: any) => (
                <option key={cat._id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Brand</h4>
            <input
              type="text"
              placeholder="e.g. Apple, Sony"
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-md px-3 py-2 text-xs outline-hidden focus:border-orange-500"
            />
          </div>

          {/* Price Range */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Price Range (₹)</h4>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-md px-2 py-1.5 text-xs outline-hidden"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-md px-2 py-1.5 text-xs outline-hidden"
              />
            </div>
          </div>

          {/* Minimum Stars */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Customer Reviews</h4>
            <div className="flex flex-col gap-2">
              {[4, 3, 2].map((stars) => (
                <button
                  key={stars}
                  onClick={() => {
                    setMinRating(stars.toString());
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 text-xs hover:text-orange-600 text-left transition ${
                    minRating === stars.toString() ? 'text-orange-600 font-extrabold' : 'text-slate-600 dark:text-slate-450'
                  }`}
                >
                  <div className="flex text-amber-500 shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < stars ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                  <span className="font-bold">&amp; Up</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* PRODUCTS RESULTS - Amazon style vertical listing */}
        <div className="flex-grow space-y-4">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg gap-4 shadow-2xs">
            <div>
              <h1 className="text-sm font-black text-slate-850 dark:text-slate-100 uppercase tracking-wide">
                {searchVal ? `Search Results for "${searchVal}"` : 'Shop Departments'}
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5 font-bold">
                Found {prodData?.total || 0} products matching query
              </p>
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs font-bold cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
          </div>

          {/* Products Results List Container */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-44 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : prodData && prodData.products.length > 0 ? (
            <div className="space-y-4">
              {prodData.products.map((prod: any) => {
                const salePrice = prod.discount > 0 ? (prod.price * (1 - prod.discount / 100)).toFixed(0) : prod.price;
                return (
                  <Link
                    key={prod._id}
                    href={`/product/${prod._id}`}
                    className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row gap-5 hover:shadow-md transition group"
                  >
                    {/* Left: Product Image */}
                    <div className="w-full sm:w-44 h-44 shrink-0 flex items-center justify-center p-2 bg-slate-50 dark:bg-slate-950 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-850 relative">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-103 transition duration-300"
                      />
                      {prod.discount > 0 && (
                        <span className="absolute top-2 left-2 bg-red-650 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                          {prod.discount}% Off
                        </span>
                      )}
                    </div>

                    {/* Right: Details panel */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="space-y-2">
                        <div>
                          <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider leading-none">{prod.brand}</p>
                          <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 mt-1 leading-snug group-hover:text-orange-600 dark:group-hover:text-orange-400">
                            {prod.name}
                          </h3>
                        </div>

                        {/* Rating stars & Prime assurance */}
                        <div className="flex items-center gap-3 flex-wrap text-xs">
                          <div className="flex items-center gap-1">
                            <div className="flex text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${i < Math.round(prod.rating) ? 'fill-amber-500' : 'text-slate-200'}`}
                                />
                              ))}
                            </div>
                            <span className="font-extrabold text-slate-650 dark:text-slate-350 ml-0.5">{prod.rating} ({prod.reviewsCount})</span>
                          </div>
                          <span className="assured-badge text-[9px]">
                            <span>Assured</span>
                            <span className="assured-badge-yellow">✓</span>
                          </span>
                        </div>

                        {/* Prices */}
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                            ₹{salePrice}
                          </span>
                          {prod.discount > 0 && (
                            <span className="text-xs text-slate-400 line-through">₹{prod.price}</span>
                          )}
                        </div>
                      </div>

                      {/* Delivery and variant info */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-semibold flex-wrap gap-2">
                        <p className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                          <span>Get it in {prod.deliveryTime || '3-4 Days'}</span>
                        </p>
                        <p className="text-indigo-650 dark:text-indigo-400 font-bold hover:underline">
                          View details &amp; specs
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs">
              <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-350">No products found</h3>
              <p className="text-xs text-slate-400 mt-1">Try expanding your price limits or adjusting brand search strings.</p>
            </div>
          )}

          {/* Pagination control list */}
          {prodData && prodData.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-2 border border-slate-250 dark:border-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 text-slate-700 dark:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-black text-slate-500">
                Page {page} of {prodData.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, prodData.pages))}
                disabled={page === prodData.pages}
                className="p-2 border border-slate-250 dark:border-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 text-slate-700 dark:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs animate-pulse">Loading products catalog...</div>}>
      <ProductsCatalog />
    </Suspense>
  );
}
