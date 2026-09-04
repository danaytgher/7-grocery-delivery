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
export const getDeliveryPartners = async (req: Request, res: Response) => {
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
    console.error("Get delivery partners error:", error.message);

    res.status(500).json({
      message: "Failed to get delivery partners",
    });
  }
};

// Create delivery partner profile
export const createDeliveryPartner = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, vehicleType } = req.body;

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
    console.error("Create delivery partner error:", error.message);

    res.status(500).json({
      message: "Failed to create delivery partner",
    });
  }
};

// Update delivery partner profile
export const updateDeliveryPartner = async (req: Request, res: Response) => {
  try {
    const { name, phone, vehicleType, isActive } = req.body;

    const data: any = {};

    if (name) {
      data.name = name;
    }

    if (phone) {
      data.phone = phone;
    }

    if (vehicleType) {
      data.vehicleType = vehicleType;
    }

    // Important: allows both true and false
    if (isActive !== undefined) {
      data.isActive = isActive;
    }

    const partner = await prisma.deliveryPartner.update({
      where: {
        id: req.params.id as string,
      },
      data,
    });

    res.json({
      partner,
    });
  } catch (error: any) {
    console.error("Update delivery partner error:", error.message);

    res.status(404).json({
      message: "Partner not found",
    });
  }
};

// Assign delivery partner to order
export const assignDeliveryPartner = async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.body;

    // Find order
    const order = await prisma.order.findUnique({
      where: {
        id: req.params.id as string,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Find delivery partner
    const partner = await prisma.deliveryPartner.findUnique({
      where: {
        id: partnerId,
      },
    });

    if (!partner) {
      return res.status(404).json({
        message: "Delivery partner not found",
      });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    let status = order.status;

    const history: any[] = Array.isArray(order.statusHistory)
      ? order.statusHistory
      : [];

    // Only change status when order is Placed or Confirmed
    if (order.status === "Placed" || order.status === "Confirmed") {
      status = "Assigned";

      history.push({
        status: "Assigned",
        note: `Assigned to ${partner.name}`,
        timestamp: new Date(),
      });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        deliveryPartnerId: partner.id,
        deliveryOtp: otp,
        status,
        statusHistory: history,
      },
    });

    res.json({
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Assign delivery partner error:", error.message);

    res.status(500).json({
      message: "Failed to assign delivery partner",
    });
  }
};
