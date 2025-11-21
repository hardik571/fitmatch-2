import React from 'react';
import { ExternalLink, ShoppingBag, CheckCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  language: 'en' | 'hi';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, language }) => {
  const isHighMatch = (product.matchScore || 0) >= 80;
  
  const translations = {
    buy: language === 'hi' ? 'Kharidein' : 'Buy Now',
    match: language === 'hi' ? 'Match' : 'Match',
    perfect: language === 'hi' ? 'Behtareen' : 'Perfect'
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col group h-full">
      {/* Image Section */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Match Score Badge */}
        {product.matchScore && (
          <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1
            ${isHighMatch ? 'bg-green-500 text-white' : 'bg-white text-gray-800'}`}>
            {isHighMatch && <CheckCircle size={12} />}
            {product.matchScore}% {translations.match}
          </div>
        )}

        {/* Virtual Try On Overlay (Mock) */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
          <button className="w-full bg-white/20 backdrop-blur-md text-white border border-white/40 py-2 rounded-lg text-xs font-medium hover:bg-white hover:text-black transition">
             {language === 'hi' ? 'Try-On (Jald Aa Raha Hai)' : 'Virtual Try-On (Beta)'}
          </button>
        </div>
      </div>

      {/* Details Section */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{product.brand}</p>
          <div className="flex gap-1">
             {product.colors.map((c, i) => (
               <span key={i} className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: c.toLowerCase() }} title={c}></span>
             ))}
          </div>
        </div>
        
        <h3 className="text-gray-900 font-medium leading-tight mb-2 line-clamp-2">{product.name}</h3>
        
        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-gray-900">{product.currency}{product.price.toLocaleString()}</span>
          
          <a 
            href={product.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gray-900 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            {translations.buy}
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;