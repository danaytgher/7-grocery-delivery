import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcrypt";

// Get admin dashboard data
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const [
      totalOrders,
      totalUsers,
      totalProducts,
      outOfStock,
      totalPartners,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          NOT: [
            {
              paymentMethod: "card",
              isPaid: false,
            },
          ],
        },
      }),

      prisma.user.count(),

      prisma.product.count(),

      prisma.product.count({
        where: {
          stock: 0,
        },
      }),

      prisma.deliveryPartner.count(),

      prisma.order.findMany({
        where: {
          NOT: [
            {
              paymentMethod: "card",
              isPaid: false,
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
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
            },
          },
        },
      }),
    ]);

    res.json({
      totalOrders,
      totalUsers,
      totalProducts,
      outOfStock,
      totalPartners,
      recentOrders,
    });
  } catch (error: any) {
    console.error("Get admin stats error:", error.message);

    res.status(500).json({
      message: "Failed to get admin statistics",
    });
  }
};

// Get delivery partners list for admin
export const getDeliveryPartners = async (
  req: Request,
  res: Response
) => {
  try {
    const partners = await prisma.deliveryPartner.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      partners,
    });
  } catch (error: any) {
    console.error(
      "Get delivery partners error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to get delivery partners",
    });
  }
};

// Create delivery partner profile
export const createDeliveryPartner = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      vehicleType,
    } = req.body;

    // Check required fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create partner
    const partner = await prisma.deliveryPartner.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        vehicleType,
      },
    });

    // Don't send password to frontend
    const { password: _, ...safePartner } = partner;

    res.status(201).json({
      partner: safePartner,
    });
  } catch (error: any) {
    console.error(
      "Create delivery partner error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to create delivery partner",
    });
  }
};

// Update delivery partner profile
export const updateDeliveryPartner = async (
  req: Request,
  res: Response
) => {
  try {
    // IMPORTANT: route uses :id
    const id = String(req.params.id);

    if (!id || id === "undefined") {
      return res.status(400).json({
        message: "Delivery partner ID is required",
      });
    }

    const {
      name,
      phone,
      vehicleType,
      isActive,
    } = req.body;

    const data: {
      name?: string;
      phone?: string;
      vehicleType?: string;
      isActive?: boolean;
    } = {};

    if (name !== undefined) {
      data.name = name;
    }

    if (phone !== undefined) {
      data.phone = phone;
    }

    if (vehicleType !== undefined) {
      data.vehicleType = vehicleType;
    }

    if (isActive !== undefined) {
      data.isActive = isActive;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "No fields provided for update",
      });
    }

    const partner = await prisma.deliveryPartner.update({
      where: {
        id,
      },
      data,
    });

    return res.status(200).json({
      message: "Delivery partner updated successfully",
      partner,
    });
  } catch (error: any) {
    console.error(
      "Update delivery partner error:",
      error
    );

    return res.status(404).json({
      message: "Partner not found",
    });
  }
};

// Assign delivery partner to order
export const assignDeliveryPartner = async (
  req: Request,
  res: Response
) => {
  try {
    // IMPORTANT: route uses :id
    const id = String(req.params.id);

    const { partnerId } = req.body;

    console.log("ORDER ID:", id);
    console.log("PARTNER ID:", partnerId);

    // Validate order ID
    if (!id || id === "undefined") {
      return res.status(400).json({
        message: "Order ID is missing",
      });
    }

    // Validate partner ID
    if (!partnerId) {
      return res.status(400).json({
        message: "Delivery partner ID is required",
      });
    }

    // Find order
    const order = await prisma.order.findUnique({
      where: {
        id,
      },
    });

    console.log("ORDER FOUND:", order);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Find delivery partner
    const partner =
      await prisma.deliveryPartner.findUnique({
        where: {
          id: String(partnerId),
        },
      });

    console.log("PARTNER FOUND:", partner);

    if (!partner) {
      return res.status(404).json({
        message: "Delivery partner not found",
      });
    }

    // Generate 6-digit OTP
    const otp = String(
      Math.floor(100000 + Math.random() * 900000)
    );

    // Current order status
    let status = order.status;

    // Existing status history
    const history: any[] =
      Array.isArray(order.statusHistory)
        ? order.statusHistory
        : [];

    // Change status
    if (
      order.status === "Placed" ||
      order.status === "Confirmed"
    ) {
      status = "Assigned";

      history.push({
        status: "Assigned",
        note: `Assigned to ${partner.name}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: {
        id,
      },
      data: {
        deliveryPartnerId: partner.id,
        deliveryOtp: otp,
        status,
        statusHistory: history,
      },
    });

    return res.status(200).json({
      message: "Delivery partner assigned successfully",
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error(
      "Assign delivery partner error:",
      error
    );

    return res.status(500).json({
      message:
        error?.message ||
        "Failed to assign delivery partner",
    });
  }
};