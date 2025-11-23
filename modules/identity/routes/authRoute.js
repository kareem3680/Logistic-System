import { Router } from "express";
const router = Router();

import { signUp, logIn } from "../controllers/authController.js";
import {
  signUpValidator,
  logInValidator,
} from "../validators/authValidator.js";

router.post("/signUp", signUpValidator, signUp);

router.post("/logIn", logInValidator, logIn);

export default router;
