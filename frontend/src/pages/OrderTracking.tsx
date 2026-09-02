
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Order } from "../types";
import { dummyDashboardOrdersData } from "../assets/assets";
import Loading from "../components/Loading";
import { ArrowLeftIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import OrderOTP from "../components/OrderTracking/OrderOTP";
import LiveMap from "../components/OrderTracking/LiveMap";
import OrderTimeLine from "../components/OrderTracking/OrderTimeLine";

const OrderTracking = () => {
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "$";
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveLocation, setLiveLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    const foundOrder = dummyDashboardOrdersData.find(
      (o) => o._id === id
    );

    setOrder(foundOrder || null);
    setLoading(false);
  }, [id]);

  if (loading) return <Loading />;

  if (!order) {
    return (
      <div className="min-h-screen bg-app-cream flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-app-green">
            Order not found
          </h2>

          <button
            onClick={() => navigate("/orders")}
            className="mt-4 px-4 py-2 bg-app-green text-white rounded-lg"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mb-20 bg-app-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-2 text-sm text-app-text-light hover:text-app-green mb-6 transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
          Back to Orders
        </button>

        {/* Order ID, Date, Status */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-app-green">
              Order #{order._id.slice(-8).toUpperCase()}
            </h1>

            <p className="text-sm text-app-text-light mt-1">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          <span
            className={`px-4 py-1.5 text-sm font-semibold rounded-full ${
              order.status === "Delivered"
                ? "bg-green-100 text-green-700"
                : order.status === "Cancelled"
                ? "bg-red-100 text-red-700"
                : "bg-app-orange/10 text-app-orange"
            }`}
          >
            {order.status}
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left Side - Timeline + Map */}
          <div className="lg:col-span-2 space-y-6">

            {/* OTP Card */}
            <OrderOTP order={order} />

            {/* Live Tracking Map */}
            <LiveMap
              order={order}
              liveLocation={liveLocation}
            />

            {/* Progress Timeline */}
            <OrderTimeLine order={order} />

            {/* Delivery Person */}
            {order.deliveryPartner &&
              order.status !== "Delivered" &&
              order.status !== "Cancelled" && (
                <div className="bg-white rounded-2xl p-5 flex items-center justify-between">

                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-full bg-app-green flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {order.deliveryPartner.name.charAt(0)}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-app-green">
                        {order.deliveryPartner.name}
                      </p>

                      <p className="text-xs text-app-text-light capitalize">
                        {order.deliveryPartner.vehicleType} • Delivery Partner
                      </p>
                    </div>
                  </div>

                  <a
                    href={`tel:${order.deliveryPartner.phone}`}
                    className="p-2.5 bg-app-cream rounded-xl hover:bg-app-cream-dark transition-colors"
                  >
                    <PhoneIcon className="size-4 text-app-green" />
                  </a>
                </div>
              )}
          </div>

          {/* Right Side - Order Details */}
          <div className="space-y-5">

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-app-green mb-3 flex items-center gap-2">
                <MapPinIcon className="size-4" />
                Delivery Address
              </h3>

              <p>
                {order.shippingAddress.label}
                <br />
                {order.shippingAddress.address}
                <br />
                {order.shippingAddress.city},{" "}
                {order.shippingAddress.state}{" "}
                {order.shippingAddress.zip}
              </p>
            </div>

            {/* Items */}
            <div className="bg-white rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-app-green mb-3">
                Items ({order.items.length})
              </h3>

              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {item.name || "Product"}
                      </p>

                      <p className="text-xs text-app-text-light">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <span className="text-sm font-semibold">
                      {currency}
                      {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="mt-4 pt-3 border-t border-app-border space-y-1.5 text-sm">

                {/* Subtotal */}
                <div className="flex justify-between">
                  <span className="text-app-text-light">
                    Subtotal
                  </span>

                  <span>
                    {currency}
                    {order.subtotal.toFixed(2)}
                  </span>
                </div>

                {/* Delivery */}
                <div className="flex justify-between">
                  <span className="text-app-text-light">
                    Delivery
                  </span>

                  <span>
                    {order.deliveryFee === 0
                      ? "Free"
                      : `${currency}${order.deliveryFee.toFixed(2)}`}
                  </span>
                </div>

                {/* Tax */}
                <div className="flex justify-between">
                  <span className="text-app-text-light">
                    Tax
                  </span>

                  <span>
                    {currency}
                    {order.tax.toFixed(2)}
                  </span>
                </div>

                {/* Total */}
                <div className="flex justify-between pt-2 border-t border-app-border font-semibold text-app-green">
                  <span>Total</span>

                  <span>
                    {currency}
                    {order.total.toFixed(2)}
                  </span>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;

