import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { createHash, randomInt } from "crypto";
import { publishOtp } from "../utils/nostr";

function generateAuthJwt(pubkey: string, userAgent: string) {
  const hashedAgent = createHash("sha256").update(userAgent).digest("hex");
  const token = jwt.sign({ pubkey, userAgent: hashedAgent }, "test", {
    expiresIn: 60 * 30,
  });
  return token;
}

function generateOtpJwt(pubkey: string, otp: string) {
  const hashedOtp = createHash("sha256").update(String(otp)).digest("hex");
  return jwt.sign({ otp: hashedOtp, pubkey }, "test", { expiresIn: 60 * 5 });
}

export function generateOtp() {
  const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const otp = Array(6)
    .fill(0)
    .map(() => numbers[randomInt(numbers.length)]);
  return otp.join("");
}

export async function getNip98AuthController(req: Request, res: Response) {
  const authData = req.authData!;
  const userAgent = req.get("user-agent");
  if (!userAgent) {
    res.status(400);
    return res.json({ error: true, status: "Bad request" });
  }
  const jwt = generateAuthJwt(authData.data.pubkey, userAgent);
  res.json({ error: false, data: { token: jwt } });
}

export async function getOTPAuthController(req: Request, res: Response) {
  const authData = req.authData!;
  const preferredRelay = req.query.relay;
  const otp = generateOtp();

  const otpJwt = generateOtpJwt(authData.data.pubkey, otp);
  await publishOtp(authData.data.pubkey, otp);
  res.json({ error: false, data: { token: otpJwt, otp } });
}
