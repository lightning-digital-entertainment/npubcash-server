import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { createHash, randomInt } from "crypto";
import { publishOtp } from "../utils/nostr";
import { RawAuthToken } from "../types";
import { decode } from "nostr-tools/nip19";

function generateAuthJwt(
  pubkey: string,
  userAgent: string,
  level: "otp" | "nip98",
  canWithdraw?: boolean,
) {
  const hashedAgent = createHash("sha256").update(userAgent).digest("hex");
  const payload: RawAuthToken = { p: pubkey, u: hashedAgent, l: level };
  if (canWithdraw) {
    payload.w = canWithdraw;
  }
  const token = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: 60 * 30,
  });
  return token;
}

function generateOtpJwt(pubkey: string, otp: string) {
  const hashedOtp = createHash("sha256").update(String(otp)).digest("hex");
  return jwt.sign({ otp: hashedOtp, pubkey }, process.env.JWT_SECRET!, {
    expiresIn: 60 * 5,
  });
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
  const canWithdraw = req.query.canWithdraw === "true";
  if (!userAgent) {
    res.status(400);
    return res.json({ error: true, status: "Bad request" });
  }
  const jwt = generateAuthJwt(
    authData.data.pubkey,
    userAgent,
    "nip98",
    canWithdraw,
  );
  res.json({ error: false, data: { token: jwt } });
}

export async function postRedeemOTPController(req: Request, res: Response) {
  console.log("Received request to redeem OTP");
  const { otpJwt, otp } = req.body;
  const userAgent = req.get("user-agent");
  if (!otpJwt || !otp || !userAgent) {
    res.status(400);
    return res.json({ error: true, status: "Bad request" });
  }
  try {
    const parsedJwt = jwt.verify(otpJwt, process.env.JWT_SECRET!) as {
      otp: string;
      pubkey: string;
    };
    console.log(`User ${parsedJwt.pubkey} is redeeming OTP`);
    const hashedOtp = createHash("sha256").update(otp).digest("hex");
    if (hashedOtp !== parsedJwt.otp) {
      console.log(otp, parsedJwt);
      res.status(400);
      return res.json({ error: true, status: "Bad Request" });
    }
    const authJwt = generateAuthJwt(parsedJwt.pubkey, userAgent, "otp");
    console.log("Generate Auth JWT");
    res.json({ error: false, data: { token: authJwt } });
  } catch (e) {
    console.error(e);
    res.status(403);
    res.json({ error: true, status: "Forbidden" });
  }
}

export async function postGenerateOTPController(
  req: Request<
    unknown,
    unknown,
    { npub: `npub1${string}`; relay?: string },
    unknown
  >,
  res: Response,
) {
  const { npub, relay } = req.body;
  console.log(`User ${npub} is requesting OTP...`);
  let pubkey: string;
  try {
    pubkey = decode(npub).data;
  } catch (e) {
    res.status(400);
    return res.json({ error: true, status: "Bad Request" });
  }
  if (!npub || !pubkey) {
    res.status(400);
    return res.json({ error: true, status: "Bad Request" });
  }
  const otp = generateOtp();

  const otpJwt = generateOtpJwt(pubkey, otp);
  console.log("Sending OTP on nostr");
  await publishOtp(pubkey, otp, relay);
  res.json({ error: false, data: { token: otpJwt } });
}
