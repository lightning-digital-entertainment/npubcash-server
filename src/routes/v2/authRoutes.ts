import { Router } from "express";
import { isAuthMiddleware } from "../../middleware/auth";
import {
  getNip98AuthController,
  postGenerateOTPController,
  postRedeemOTPController,
} from "../../controller/auth";

const authRouter = Router();

authRouter.get(
  "/nip98",
  isAuthMiddleware("/api/v2/auth/nip98", "GET"),
  getNip98AuthController,
);
authRouter.post("/otp/request", postGenerateOTPController);
authRouter.post("/otp/redeem", postRedeemOTPController);

export default authRouter;
