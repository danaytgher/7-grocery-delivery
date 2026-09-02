import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

// GET /api/products/flash-deals
export const getFlashDeals = async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                stock: {
                    gt: 0,
                },
            },
            orderBy: {
                originalPrice: "desc",
            },
        });

        const productsWithDiscount = products.map((p: any) => {
            const discount =
                p.originalPrice && p.price
                    ? Math.round(
                          ((p.originalPrice - p.price) / p.originalPrice) * 100
                      )
                    : 0;

            return {
                ...p,
                discount,
            };
        });

        res.json({
            products: productsWithDiscount,
        });
    } catch (error) {
        console.error("Get flash deals error:", error);

        res.status(500).json({
            message: "Failed to get flash deals",
        });
    }
};

// GET /api/products
export const getProducts = async (req: Request, res: Response) => {
    try {
        const { category, search, minPrice, maxPrice, sort } = req.query;

        const where: any = {};

        if (category && category !== "all") {
            where.category = category as string;
        }

        if (search) {
            where.name = {
                contains: search as string,
                mode: "insensitive",
            };
        }

        if (minPrice || maxPrice) {
            where.price = {};

            if (minPrice) {
                where.price.gte = Number(minPrice);
            }

            if (maxPrice) {
                where.price.lte = Number(maxPrice);
            }
        }

        const orderBy: any = {};

        if (sort === "price-low") {
            orderBy.price = "asc";
        } else if (sort === "price-high") {
            orderBy.price = "desc";
        } else {
            orderBy.createdAt = "desc";
        }

        const products = await prisma.product.findMany({
            where,
            orderBy,
        });

        const productsWithDiscount = products.map((p: any) => {
            const discount =
                p.originalPrice && p.price
                    ? Math.round(
                          ((p.originalPrice - p.price) / p.originalPrice) * 100
                      )
                    : 0;

            return {
                ...p,
                discount,
            };
        });

        res.json({
            products: productsWithDiscount,
        });
    } catch (error) {
        console.error("Get products error:", error);

        res.status(500).json({
            message: "Failed to get products",
        });
    }
};

// GET /api/products/:id
export const getProduct = async (req: Request, res: Response) => {
    try {
        const product = await prisma.product.findUnique({
            where: {
                id: req.params.id as string,
            },
        });

        if (!product) {
            res.status(404).json({
                message: "Product not found",
            });
            return;
        }

        const discount =
            product.originalPrice && product.price
                ? Math.round(
                      ((product.originalPrice - product.price) /
                          product.originalPrice) *
                          100
                  )
                : 0;

        res.json({
            product: {
                ...product,
                discount,
            },
        });
    } catch (error) {
        console.error("Get product error:", error);

        res.status(500).json({
            message: "Failed to get product",
        });
    }
};

// POST /api/products
export const createProduct = async (req: Request, res: Response) => {
    try {
        const product = await prisma.product.create({
            data: req.body,
        });

        res.status(201).json({
            product,
        });
    } catch (error) {
        console.error("Create product error:", error);

        res.status(500).json({
            message: "Failed to create product",
        });
    }
};

// PUT /api/products/:id
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const product = await prisma.product.update({
            where: {
                id: req.params.id as string,
            },
            data: req.body,
        });

        res.json({
            product,
        });
    } catch (error) {
        console.error("Update product error:", error);

        res.status(500).json({
            message: "Failed to update product",
        });
    }
};

// DELETE /api/products/:id
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        await prisma.product.delete({
            where: {
                id: req.params.id as string,
            },
        });

        res.json({
            message: "Deleted",
        });
    } catch (error) {
        console.error("Delete product error:", error);

        res.status(500).json({
            message: "Failed to delete product",
        });
    }
};