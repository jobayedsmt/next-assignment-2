import bcrypt from "bcryptjs";
import config from "../../config";
import { pool } from "../../db";
import type { IUser } from "./auth.interface";
import jwt from "jsonwebtoken";


const checkUser = async (email: string) => {
    const existingUser = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    );
    return existingUser
}

const signupUserIntoDB = async (payLoad: IUser) => {
    const {name, email, password} = payLoad;
    const result = await pool.query(
        `INSERT INTO users (name, email, password) 
             VALUES ($1, $2, $3)
             RETURNING id, name, email, role, created_at, updated_at`,
        [name, email, password]
    );
    return result.rows[0]
}



const loginUser = async (payload: IUser) => {
  const { email, password } = payload;

  // Check user exists
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Compare password
  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordMatched) {
    throw new Error("Invalid email or password");
  }

  // JWT Payload
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(
    jwtPayload,
    config.jwt_secret,
    {
      expiresIn: "7d",
    }
  );

  // Remove password from response
  const {
    password: _,
    ...userWithoutPassword
  } = user;

  return {
    token,
    user: userWithoutPassword,
  };
};


export const userService = {
    checkUser,
    signupUserIntoDB,
    loginUser,
};