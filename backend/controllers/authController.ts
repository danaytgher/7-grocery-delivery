import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Generate JWT token
const generateToken = (id: string) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET as string,
        { expiresIn: "30d" }
    );
};

// Check if user is admin
const getAdminStatus = (
    email: string | null | undefined
): boolean => {
    if (!email) return false;

    const adminEmails = process.env.ADMIN_EMAILS
        ? process.env.ADMIN_EMAILS
              .split(",")
              .map((e) => e.trim().toLowerCase())
        : [];

    return adminEmails.includes(email.toLowerCase());
};

// Register
// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        // Check required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please provide all fields",
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email.toLowerCase(),
            },
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists with this email",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
            },
        });

        // Generate JWT token
        const token = generateToken(user.id);

        // Remove password before sending user data
        const userData: any = { ...user };
        delete userData.password;

        // Check admin status
        userData.isAdmin = getAdminStatus(userData.email);

        return res.status(201).json({
            user: userData,
            token,
        });
    } catch (error) {
        console.error("Register error:", error);

        return res.status(500).json({
            message: "Server error while registering user",
        });
    }
};

// Login
// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide email and password",
            });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: {
                email: email.toLowerCase(),
            },
            include: {
                addresses: true,
            },
        });

        // User doesn't exist
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        // Generate JWT token
        const token = generateToken(user.id);

        // Remove password before sending user data
        const userData: any = { ...user };
        delete userData.password;

        // Check admin status
        userData.isAdmin = getAdminStatus(userData.email);

        return res.status(200).json({
            user: userData,
            token,
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Server error while logging in",
        });
    }
};