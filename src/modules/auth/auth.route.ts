import { Router } from "express";
import { userController } from "./auth.controller";

const router = Router();

router.post("/signup", userController.signupUser);

router.post("/login", userController.loginUser)

export const authRoute = router;
