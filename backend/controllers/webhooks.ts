import { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";

const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY as string
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const stripeWebhook = async (
    request: Request,
    response: Response
) => {
    let event: Stripe.Event;

    // Verify Stripe webhook signature
    if (endpointSecret) {
        const signature = request.headers["stripe-signature"];

        if (!signature) {
            return response
                .status(400)
                .send("Missing Stripe signature");
        }

        try {
            event = stripe.webhooks.constructEvent(
                request.body,
                signature,
                endpointSecret
            );
        } catch (err) {
            console.log(
                "⚠️ Webhook signature verification failed.",
                err instanceof Error ? err.message : err
            );

            return response.sendStatus(400);
        }
    } else {
        return response
            .status(500)
            .send("Stripe webhook secret is not configured");
    }

    // Handle the event
    switch (event.type) {
        // --------------------------------
        // PAYMENT SUCCEEDED
        // --------------------------------
        case "payment_intent.succeeded": {
            const paymentIntent =
                event.data.object as Stripe.PaymentIntent;

            const paymentIntentId = paymentIntent.id;

            // Get checkout session using payment intent
            const session =
                await stripe.checkout.sessions.list({
                    payment_intent: paymentIntentId,
                });

            if (!session.data.length) {
                console.log(
                    "No checkout session found for payment:",
                    paymentIntentId
                );
                break;
            }

            const orderId = session.data[0].metadata?.orderId;

            if (!orderId) {
                console.log(
                    "No orderId found in checkout session metadata"
                );
                break;
            }

            // Mark order as paid
            const paidOrder = await prisma.order.update({
                where: {
                    id: orderId,
                },
                data: {
                    isPaid: true,
                },
            });

            // Get order items
            const orderItems = Array.isArray(paidOrder.items)
                ? (paidOrder.items as any[])
                : [];

            // Decrease stock
            for (const item of orderItems) {
                await prisma.product.update({
                    where: {
                        id: item.product,
                    },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                });
            }

            // Send order paid event
            await inngest.send({
                name: "order/paid",
                data: {
                    orderId,
                },
            });

            // Send stock update events
            for (const item of orderItems) {
                await inngest.send({
                    name: "inventory/stock.updated",
                    data: {
                        productId: item.product,
                    },
                });
            }

            console.log(
                `Payment successful for order ${orderId}`
            );

            break;
        }

        // --------------------------------
        // PAYMENT FAILED / CANCELED
        // --------------------------------
        case "payment_intent.canceled":
        case "payment_intent.payment_failed": {
            const paymentIntentFailure =
                event.data.object as Stripe.PaymentIntent;

            const paymentIntentFailureId =
                paymentIntentFailure.id;

            // Get checkout session
            const sessionFailure =
                await stripe.checkout.sessions.list({
                    payment_intent: paymentIntentFailureId,
                });

            if (!sessionFailure.data.length) {
                console.log(
                    "No checkout session found for failed payment:",
                    paymentIntentFailureId
                );
                break;
            }

            const failureOrderId =
                sessionFailure.data[0].metadata?.orderId;

            if (!failureOrderId) {
                console.log(
                    "No orderId found for failed payment"
                );
                break;
            }

            // Delete unpaid order
            await prisma.order.delete({
                where: {
                    id: failureOrderId,
                },
            });

            console.log(
                `Order ${failureOrderId} deleted because payment failed/canceled`
            );

            break;
        }

        // --------------------------------
        // OTHER EVENTS
        // --------------------------------
        default: {
            console.log(
                `Unhandled event type ${event.type}`
            );

            break;
        }
    }

    // Tell Stripe we received the webhook
    return response.json({
        received: true,
    });
};