
import {
  ArrowUpRightIcon,
  BikeIcon,
  ChevronDownIcon,
  LogOutIcon,
  MapPinIcon,
  MenuIcon,
  PackageIcon,
  SearchIcon,
  ShieldIcon,
  ShoppingCartIcon,
  UserIcon,
  XIcon,
} from "lucide-react";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();

  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigate = useNavigate();

  // ==============================
  // SEARCH
  // ==============================
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setUserMenuOpen(false);
    }
  };

  // ==============================
  // LOGOUT
  // ==============================
  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-app-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">

        {/* ==============================
            LOGO
        ============================== */}
        <Link
          to="/"
          className="flex items-center gap-2 text-[22px] font-medium shrink-0"
        >
          <BikeIcon size={24} />
          Instacart
        </Link>

        <div className="w-full flex items-center justify-end gap-4 lg:gap-10">

          {/* ==============================
              DESKTOP NAV LINKS
          ============================== */}
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-600">
            <Link to="/">
              Home
            </Link>

            <Link to="/products">
              Products
            </Link>

            <Link
              to="/deals"
              className="text-app-orange"
            >
              Deals
            </Link>
          </div>

          {/* ==============================
              SEARCH
          ============================== */}
          <form
            className="hidden sm:flex flex-1 max-w-sm text-xs sm:text-sm"
            onSubmit={handleSearch}
          >
            <div className="relative w-full">

              <SearchIcon
                className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500"
              />

              <input
                type="text"
                placeholder="Search for groceries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 p-2 bg-orange-50 rounded-full ring ring-app-orange/15 focus:ring-app-orange/30"
              />

            </div>
          </form>

          {/* ==============================
              RIGHT ACTIONS
          ============================== */}
          <div className="flex items-center gap-3">

            {/* ==============================
                CART
            ============================== */}
            <button
              type="button"
              className="relative p-2 rounded-xl"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCartIcon className="size-5 text-zinc-900" />

              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 size-4 bg-app-orange text-white text-[10px] rounded-full flex-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* ==============================
                USER SECTION
            ============================== */}
            <div className="relative">

              {user ? (

                // ============================
                // LOGGED IN USER
                // ============================
                <button
                  type="button"
                  className="flex items-center gap-2 p-2"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="size-7 rounded-full bg-green-950 text-white flex-center">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>

                  <ChevronDownIcon className="size-3 text-zinc-500" />
                </button>

              ) : (

                // ============================
                // LOGGED OUT USER
                // ============================
                <div className="flex-center gap-2">

                  <Link
                    to="/login"
                    className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-950 rounded-full hover:bg-green-950-light transition-colors"
                  >
                    <UserIcon size={16} />
                    Sign In
                  </Link>

                  {userMenuOpen ? (
                    <XIcon
                      className="md:hidden cursor-pointer"
                      onClick={() => setUserMenuOpen(false)}
                    />
                  ) : (
                    <MenuIcon
                      className="md:hidden cursor-pointer"
                      onClick={() => setUserMenuOpen(true)}
                    />
                  )}

                </div>
              )}

              {/* ==============================
                  USER DROPDOWN
              ============================== */}
              {userMenuOpen && (
                <>
                  {/* Background overlay */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />

                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2.5 w-56 bg-white rounded-xl shadow-lg border border-app-border py-2 z-50 animate-fade-in">

                    {/* ==========================
                        USER INFORMATION
                    ========================== */}
                    {user && (
                      <div className="px-4 py-2 border-b border-app-border">
                        <p className="text-sm font-medium text-zinc-900">
                          {user.name}
                        </p>

                        <p className="text-xs text-zinc-500">
                          {user.email}
                        </p>

                        {/* Show role for debugging/confirmation */}
                        {user.role && (
                          <p className="text-xs text-zinc-400 mt-1 capitalize">
                            {user.role}
                          </p>
                        )}
                      </div>
                    )}

                    <div>

                      {/* ==========================
                          SIGN IN
                      ========================== */}
                      {!user && (
                        <Link
                          to="/login"
                          className="dropdown-link"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <UserIcon size={16} />
                          Sign In
                        </Link>
                      )}

                      {/* ==========================
                          MY ORDERS
                      ========================== */}
                      {user && (
                        <Link
                          to="/orders"
                          className="dropdown-link"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <PackageIcon size={16} />
                          My Orders
                        </Link>
                      )}

                      {/* ==========================
                          ADDRESSES
                      ========================== */}
                      {user && (
                        <Link
                          to="/addresses"
                          className="dropdown-link"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <MapPinIcon size={16} />
                          Addresses
                        </Link>
                      )}

                      {/* ==========================
                          PRODUCTS - MOBILE
                      ========================== */}
                      <Link
                        to="/products"
                        className="dropdown-link md:hidden"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <ArrowUpRightIcon size={16} />
                        Products
                      </Link>

                      {/* ==========================
                          DEALS - MOBILE
                      ========================== */}
                      <Link
                        to="/deals"
                        className="dropdown-link md:hidden"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <ArrowUpRightIcon size={16} />
                        Deals
                      </Link>

                      {/* ==========================
                          ADMIN PANEL
                      ========================== */}

                      {user?.role === "admin" && (
                        <Link
                          to="/admin/products"
                          className="dropdown-link"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <ShieldIcon
                            className="text-app-orange-dark"
                            size={16}
                          />

                          <span className="text-app-orange-dark">
                            Admin Panel
                          </span>
                        </Link>
                      )}

                      {/* ==========================
                          LOGOUT
                      ========================== */}
                      {user && (
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-app-error hover:bg-red-50 w-full transition-colors"
                        >
                          <LogOutIcon size={16} />
                          Logout
                        </button>
                      )}

                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

