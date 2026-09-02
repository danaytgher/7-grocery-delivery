import { Plus } from "lucide-react";
import type { Product } from "../types";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

interface Props {
  product: Product;
}

const ProductCard = ({ product }: Props) => {
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "$";
  const {addToCart} = useCart()
  const navigate = useNavigate();

  
  // Handle clicking the product card
  const handleCardClick = () => {
    navigate(`/products/${product._id}`);
  };

  // Handle clicking the add-to-cart button
  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Product Image */}
      <div className="relative w-full aspect-square bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />

        {/* Discount Badge */}
        {product.discount > 0 && (
          <span className="absolute top-2 left-2 bg-app-orange text-white text-xs font-medium px-2 py-1 rounded-full">
            {product.discount}% OFF
          </span>
        )}
      </div>

      {/* Product Information */}
      <div className="p-3">
        {/* Product Name */}
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {product.name}
        </h3>

        {/* Price + Add Button */}
        <div className="flex items-center justify-between gap-2 mt-2">
          {/* Price */}
          <div className="flex items-center gap-1 min-w-0">
            {/* Current Price */}
            <span className="text-base font-medium whitespace-nowrap">
              {currency}
              {Number(product.price).toFixed(1)}
            </span>

            {/* Unit */}
            <span className="text-xs text-app-text-light whitespace-nowrap">
              /{product.unit}
            </span>

            {/* Original Price */}
            {product.originalPrice > product.price && (
              <span className="text-xs text-app-text-light line-through ml-1.5 whitespace-nowrap">
                {currency}
                {Number(product.originalPrice).toFixed(1)}
              </span>
            )}
          </div>

          {/* Add To Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="size-7 rounded-full bg-app-orange text-white flex items-center justify-center shrink-0 hover:bg-app-orange-dark transition-colors active:scale-95"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;