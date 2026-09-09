
import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";
import Stripe from "stripe";

// =====================================================
// CREATE ORDER
// POST /api/orders
// =====================================================

export const createOrder = async (req: Request, res: Response) => {
    try {
        const {
            items,
            shippingAddress,
            paymentMethod,
        } = req.body;

        // =================================================
        // CHECK ORDER ITEMS
        // =================================================

        if (!items || items.length === 0) {
            return res.status(400).json({
                message: "No order items",
            });
        }

        // =================================================
        // CHECK AUTHENTICATION
        // =================================================

        if (!req.user?.id) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        // =================================================
        // GET PRODUCTS FROM DATABASE
        // =================================================

        const productIds = items.map(
            (item: any) => item.product
        );

        const products = await prisma.product.findMany({
            where: {
                id: {
                    in: productIds,
                },
            },
        });

        // Create product lookup map
        const productMap: Record<
            string,
            (typeof products)[0]
        > = {};

        products.forEach((product) => {
            productMap[product.id] = product;
        });

        // =================================================
        // CHECK STOCK
        // =================================================

        for (const item of items) {
            const product = productMap[item.product];

            if (!product) {
                return res.status(404).json({
                    message: `Product ${item.product} not found`,
                });
            }

            if (
                (product.stock ?? 0) <
                item.quantity
            ) {
                return res.status(404).json({
                    message: `${product.name} is out of stock`,
                });
            }
        }

        // =================================================
        // CREATE ORDER ITEMS
        // USE DATABASE PRICES
        // =================================================

        const orderItems = items.map((item: any) => {
            const dbProduct =
                productMap[item.product];

            if (!dbProduct) {
                throw new Error(
                    `Product ${item.product} not found`
                );
            }

            return {
                product: dbProduct.id,
                name: dbProduct.name,
                image: dbProduct.image,
                price: dbProduct.price,
                quantity: item.quantity,
                unit: dbProduct.unit,
            };
        });

        // =================================================
        // CALCULATE TOTALS
        // =================================================

        const subtotal = orderItems.reduce(
            (sum: number, item: any) => {
                return (
                    sum +
                    item.price * item.quantity
                );
            },
            0
        );

        const deliveryFee =
            subtotal > 20 ? 0 : 1.99;

        const tax =
            Math.round(
                subtotal * 0.08 * 100
            ) / 100;

        const total =
            Math.round(
                (
                    subtotal +
                    deliveryFee +
                    tax
                ) * 100
            ) / 100;

        // =================================================
        // CREATE ORDER
        // =================================================

        const order = await prisma.order.create({
            data: {
                userId: req.user.id,

                items: orderItems,

                shippingAddress,

                paymentMethod,

                subtotal,

                deliveryFee,

                tax,

                total,

                // isPaid remains false by default
                // until Stripe confirms payment.

                statusHistory: [
                    {
                        status: "Placed",
                        note: "Order placed successfully",
                        timestamp: new Date(),
                    },
                ],
            },
        });

        console.log(
            "========================================"
        );

        console.log(
            "✅ ORDER CREATED:",
            order.id
        );

        console.log(
            "💰 TOTAL:",
            total
        );

        console.log(
            "💳 PAYMENT METHOD:",
            paymentMethod
        );

        // =================================================
        // CARD PAYMENT
        // =================================================

        if (paymentMethod === "card") {
            const stripe = new Stripe(
                process.env.STRIPE_SECRET_KEY as string
            );

            const origin =
                req.headers.origin ||
                process.env.FRONTEND_URL ||
                "http://localhost:5173";

            // ---------------------------------------------
            // CREATE STRIPE CHECKOUT SESSION
            // ---------------------------------------------

            const session =
                await stripe.checkout.sessions.create({
                    mode: "payment",

                    success_url:
                        `${origin}/orders?clearCart=true`,

                    cancel_url:
                        `${origin}/checkout`,

                    line_items: [
                        {
                            price_data: {
                                currency: "usd",

                                product_data: {
                                    name:
                                        "Payment Groceries",
                                },

                                unit_amount:
                                    Math.round(
                                        total * 100
                                    ),
                            },

                            quantity: 1,
                        },
                    ],

                    // -----------------------------------------
                    // ORDER ID ON CHECKOUT SESSION
                    // -----------------------------------------

                    metadata: {
                        orderId: order.id,
                    },

                    // -----------------------------------------
                    // ORDER ID ON PAYMENT INTENT
                    // -----------------------------------------

                    payment_intent_data: {
                        metadata: {
                            orderId: order.id,
                        },
                    },
                });

            console.log(
                "✅ STRIPE CHECKOUT SESSION CREATED:",
                session.id
            );

            console.log(
                "🧾 STRIPE ORDER ID:",
                session.metadata?.orderId
            );

            console.log(
                "🔗 STRIPE URL:",
                session.url
            );

            console.log(
                "========================================"
            );

            // ---------------------------------------------
            // RETURN STRIPE CHECKOUT URL
            // ---------------------------------------------

            return res.json({
                url: session.url,
                orderId: order.id,
            });
        }

        // =================================================
        // CASH ON DELIVERY
        // =================================================

        if (paymentMethod === "cash") {
            // ---------------------------------------------
            // DECREASE STOCK
            // ---------------------------------------------

            for (const item of orderItems) {
                await prisma.product.update({
                    where: {
                        id: item.product,
                    },

                    data: {
                        stock: {
                            decrement:
                                item.quantity,
                        },
                    },
                });
            }

            console.log(
                "📦 Stock decreased for cash order"
            );

            // ---------------------------------------------
            // SEND INVENTORY EVENTS
            // ---------------------------------------------

            for (const item of orderItems) {
                await inngest.send({
                    name:
                        "inventory/stock.updated",

                    data: {
                        productId:
                            item.product,
                    },
                });
            }

            // ---------------------------------------------
            // SEND ORDER PLACED EVENT
            // ---------------------------------------------

            await inngest.send({
                name: "order/placed",

                data: {
                    orderId: order.id,
                },
            });

            console.log(
                "📨 order/placed event sent:",
                order.id
            );

            console.log(
                "========================================"
            );

            return res.json({
                order,
            });
        }

        // =================================================
        // INVALID PAYMENT METHOD
        // =================================================

        return res.status(400).json({
            message: "Invalid payment method",
        });

    } catch (error) {
        console.error(
            "❌ CREATE ORDER ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to create order",
        });
    }
};

// =====================================================
// GET USER ORDERS
// GET /api/orders
// =====================================================

export const getUserOrders = async (
    req: Request,
    res: Response
) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const { status } = req.query;

        const where: any = {
            userId: req.user.id,

            // Hide unpaid card orders
            NOT: [
                {
                    paymentMethod: "card",
                    isPaid: false,
                },
            ],
        };

        if (
            status &&
            status !== "all"
        ) {
            where.status = status;
        }

        const orders =
            await prisma.order.findMany({
                where,

                include: {
                    deliveryPartner: {
                        select: {
                            name: true,
                            phone: true,
                        },
                    },
                },

                orderBy: {
                    createdAt: "desc",
                },
            });

        return res.json({
            orders,
        });

    } catch (error) {
        console.error(
            "❌ Get user orders error:",
            error
        );

        return res.status(500).json({
            message: "Failed to get orders",
        });
    }
};

// =====================================================
// GET SINGLE ORDER
// GET /api/orders/:id
// =====================================================

export const getOrder = async (
    req: Request,
    res: Response
) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const order =
            await prisma.order.findFirst({
                where: {
                    id: req.params.id as string,

                    userId: req.user.id,
                },

                include: {
                    deliveryPartner: {
                        select: {
                            name: true,
                            phone: true,
                            avatar: true,
                            vehicleType: true,
                        },
                    },
                },
            });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        return res.json({
            order,
        });

    } catch (error) {
        console.error(
            "❌ Get order error:",
            error
        );

        return res.status(500).json({
            message: "Failed to get order",
        });
    }
};

// =====================================================
// UPDATE ORDER STATUS
// PUT /api/orders/:id/status
// =====================================================

export const updateOrderStatus = async (
    req: Request,
    res: Response
) => {
    try {
        const { status, note } = req.body;

        const order =
            await prisma.order.findUnique({
                where: {
                    id: req.params.id as string,
                },
            });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        const history = (
            Array.isArray(order.statusHistory)
                ? order.statusHistory
                : []
        ) as any[];

        history.push({
            status,

            note:
                note ||
                `Order ${status.toLowerCase()}`,

            timestamp: new Date(),
        });

        const updatedOrder =
            await prisma.order.update({
                where: {
                    id: req.params.id as string,
                },

                data: {
                    status,

                    statusHistory: history,
                },
            });

        return res.json({
            order: updatedOrder,
        });

    } catch (error) {
        console.error(
            "❌ Update order status error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to update order status",
        });
    }
};

// =====================================================
// GET ALL ORDERS
// GET /api/orders/all
// =====================================================

export const getAllOrders = async (
    req: Request,
    res: Response
) => {
    try {
        const orders =
            await prisma.order.findMany({
                where: {
                    // Hide unpaid card orders
                    NOT: [
                        {
                            paymentMethod: "card",
                            isPaid: false,
                        },
                    ],
                },

                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },

                    deliveryPartner: {
                        select: {
                            name: true,
                            phone: true,
                            email: true,
                        },
                    },
                },

                orderBy: {
                    createdAt: "desc",
                },
            });

        return res.json({
            orders,
        });

    } catch (error) {
        console.error(
            "❌ Get all orders error:",
            error
        );

        return res.status(500).json({
            message: "Failed to get orders",
        });
    }
};

// =====================================================
// GET ORDER LOCATION
// GET /api/orders/:id/location
// =====================================================

export const getOrderLocation = async (
    req: Request,
    res: Response
) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const order =
            await prisma.order.findFirst({
                where: {
                    id: req.params.id as string,

                    userId: req.user.id,
                },

                select: {
                    liveLocation: true,
                    status: true,
                },
            });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        return res.json({
            liveLocation:
                order.liveLocation,

            status: order.status,
        });

    } catch (error) {
        console.error(
            "❌ Get order location error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to get order location",
        });
    }
};

