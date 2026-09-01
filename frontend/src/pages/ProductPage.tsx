
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  HomeIcon,
  LeafIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  StarIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useCart } from "../context/CartContext";
import type { Product } from "../types";
import { dummyProducts } from "../assets/assets";
import ProductCard from "../components/ProductCard";
import Loading from "../components/Loading";
import DummyReviewsSection from "../assets/DummyReviewsSection";

const ProductPage = () => {
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "$";
  const { id } = useParams();
  const navigate = useNavigate();

  const { items, addToCart, updateQuantity, removeFromCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [localQuantity, setLocalQuantity] = useState(1);

  useEffect(() => {
    setLoading(true);
    setLocalQuantity(1);
    window.scrollTo(0, 0);

    const foundProduct = dummyProducts.find((p) => p._id === id);

    if (foundProduct) {
      setProduct(foundProduct);

      // Show products from the same category
      const related = dummyProducts.filter(
        (p) => p.category === foundProduct.category && p._id !== id
      );

      setRelatedProducts(related);
    } else {
      setProduct(null);
      setRelatedProducts([]);
    }

    setLoading(false);
  }, [id]);

  // Loading state
  if (loading) {
    return <Loading />;
  }

  // Product not found
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-app-green mb-3">
            Product not found
          </h2>

          <Link
            to="/products"
            className="text-app-orange hover:underline"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  // Check if product is already in cart
  const cartItem = items.find(
    (item) => item.product._id === product._id
  );

  const inCart = !!cartItem;

  const displayQuantity = inCart
    ? cartItem.quantity
    : localQuantity;

  // Decrease quantity
  const handleMinus = () => {
    if (inCart) {
      if (cartItem.quantity > 1) {
        updateQuantity(product._id, cartItem.quantity - 1);
      } else {
        removeFromCart(product._id);
      }
    } else {
      setLocalQuantity(Math.max(1, localQuantity - 1));
    }
  };

  // Increase quantity
  const handlePlus = () => {
    if (inCart) {
      updateQuantity(product._id, cartItem.quantity + 1);
    } else {
      setLocalQuantity(localQuantity + 1);
    }
  };

  // Convert "fresh-fruits" to "fresh fruits"
  const categoryLabel = product.category.replace(/-/g, " ");

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-app-text-light mb-6">
          <Link
            to="/"
            className="hover:text-app-green transition-colors"
          >
            <HomeIcon className="size-4" />
          </Link>

          <span>/</span>

          <Link
            to="/products"
            className="hover:text-app-green transition-colors"
          >
            Products
          </Link>

          <span>/</span>

          <Link
            to={`/products?category=${product.category}`}
            className="hover:text-app-green transition-colors capitalize"
          >
            {categoryLabel}
          </Link>

          <span>/</span>

          <span className="text-app-green font-medium truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1.5 text-sm text-app-text-light hover:text-app-green transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
          Back
        </button>

        {/* Product Details */}
        <div className="bg-white/50 rounded-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">

            {/* Left side - Image */}
            <div className="relative flex items-center justify-center p-8 md:p-12 min-h-[320px] md:min-h-[480px]">
              <img
                src={product.image}
                alt={product.name}
                className="max-h-[360px] w-auto object-contain"
              />

              {/* Badges */}
              <div className="absolute top-5 left-5 flex flex-wrap gap-1.5">

                {/* Organic badge */}
                {product.isOrganic && (
                  <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-app-green text-white rounded-full">
                    <LeafIcon className="w-3 h-3" />
                    Organic
                  </span>
                )}

                {/* Discount badge */}
                {product.discount > 0 && (
                  <span className="px-2.5 py-1 text-xs font-semibold bg-app-orange text-white rounded-full">
                    {product.discount}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Right side - Details */}
            <div className="p-6 md:p-10 flex flex-col justify-center">

              {/* Category */}
              <span className="text-xs font-medium text-app-text-light tracking-wider mb-2 capitalize">
                {categoryLabel}
              </span>

              {/* Product name */}
              <h1 className="text-2xl md:text-3xl font-semibold text-app-green mb-3">
                {product.name}
              </h1>

              {/* Rating */}
              {product.rating > 0 && (
                <div className="flex items-center gap-2 mb-5">

                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(product.rating)
                            ? "text-app-warning fill-app-warning"
                            : "text-app-border"
                        }`}
                      />
                    ))}
                  </div>

                  <span className="text-sm font-medium">
                    {product.rating}
                  </span>

                  <span className="text-sm text-app-text-light">
                    ({product.reviewCount} reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-semibold text-app-green">
                  {currency}
                  {product.price.toFixed(2)}
                </span>

                {product.originalPrice > product.price && (
                  <span className="text-sm text-app-text-light line-through">
                    {currency}
                    {product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-app-text-light leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Stock */}
              <div className="mb-6">
                {product.stock > 0 ? (
                  <span className="text-sm text-app-success font-medium">
                    ✓ In Stock ({product.stock} available)
                  </span>
                ) : (
                  <span className="text-sm text-app-error font-medium">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Quantity + Add to Cart */}
              <div className="flex items-center gap-3">

                {/* Quantity */}
                <div className="flex items-center border border-app-border rounded-xl overflow-hidden">

                  <button
                    onClick={handleMinus}
                    className="p-3 hover:bg-app-cream transition-colors"
                    disabled={product.stock === 0}
                  >
                    <MinusIcon className="w-4 h-4" />
                  </button>

                  <span className="px-5 text-sm font-semibold min-w-[40px] text-center">
                    {displayQuantity}
                  </span>

                  <button
                    onClick={handlePlus}
                    className="p-3 hover:bg-app-cream transition-colors"
                    disabled={
                      product.stock === 0 ||
                      displayQuantity >= product.stock
                    }
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>

                </div>

                {/* Add to Cart */}
                <button
                  onClick={() => {
                    if (!inCart) {
                      addToCart(product, localQuantity);
                    }
                  }}
                  disabled={product.stock === 0 || inCart}
                  className={`flex-1 py-3 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${
                    inCart
                      ? "bg-app-cream text-app-green border border-app-green"
                      : "bg-app-orange text-white hover:bg-app-orange-dark"
                  }`}
                >
                  <ShoppingCartIcon className="w-4 h-4" />

                  {inCart ? "Added to Cart" : "Add to Cart"}
                </button>

              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews */}
        {product.reviewCount > 0 && (
          <DummyReviewsSection product={product} />
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 mb-44">

            {/* Section heading */}
            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-2xl font-semibold text-app-green">
                  Related Products
                </h2>

                <p className="text-sm text-app-text-light mt-1">
                  More from {categoryLabel}
                </p>
              </div>

              <Link
                to={`/products?category=${product.category}`}
                className="flex items-center gap-1.5 text-sm font-medium text-app-green hover:text-app-orange transition-colors"
              >
                View All
                <ArrowRightIcon className="size-4" />
              </Link>

            </div>

            {/* Product cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 xl:gap-8">
              {relatedProducts.slice(0, 5).map((rp) => (
                <ProductCard
                  key={rp._id}
                  product={rp}
                />
              ))}
            </div>

          </section>
        )}

      </div>
    </div>
  );
};

export default ProductPage;

