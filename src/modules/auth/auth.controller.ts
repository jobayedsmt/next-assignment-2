import type { Request, Response } from "express";
import { userService } from "./auth.service";
import bcrypt from "bcryptjs";

const signupUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const existingUser = await userService.checkUser(email);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await userService.signupUserIntoDB({
      name,
      email,
      password: hashedPassword,
      role, // 🔥 FIXED: pass role
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};


const loginUser = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await userService.loginUser(
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Login failed",
      errors: null,
    });
  }
};



export const userController = {
    signupUser,
    loginUser,
};