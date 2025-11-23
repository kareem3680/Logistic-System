import { Router } from "express";
const router = Router();

import { getMyData, updateMyData } from "../controllers/userController.js";
import { updateMyDataValidator } from "../validators/userValidator.js";
import { protect } from "../controllers/authController.js";

router.get("/getMyData", protect, getMyData);

router.patch("/updateMyData", protect, updateMyDataValidator, updateMyData);

export default router;
