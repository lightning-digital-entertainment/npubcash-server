import { NextFunction, Request, Response } from "express";
import { verifyAuth } from "../utils/auth";
import { User } from "../models/user";
import { Claim } from "../models/claim";
import { CashuMint, getEncodedToken } from "@cashu/cashu-ts";

export async function balanceController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    res.status(401);
    return next(new Error("Unauthorized"));
  }
  const isAuth = await verifyAuth(
    authHeader,
    `${process.env.HOSTNAME}api/v1/balance`,
    "GET",
  );
  if (!isAuth.authorized) {
    res.status(401);
    return next(new Error("Unauthorized"));
  }
  const user = await User.getUserByPubkey(isAuth.data.pubkey);
  let allClaims: Claim[];
  if (user) {
    const userClaims = await Claim.getUserClaims(user.name);
    const npubClaims = await Claim.getUserClaims(isAuth.data.npub);
    allClaims = [...userClaims, ...npubClaims];
  } else {
    const npubClaims = await Claim.getUserClaims(isAuth.data.npub);
    allClaims = npubClaims;
  }
  const proofs = allClaims.map((claim) => claim.proofs).flat();
  const payload = {
    proofs: proofs.map((p) => ({ secret: p.secret })),
  };
  const { spendable } = await new CashuMint(process.env.MINTURL!).check(
    payload,
  );
  const spendableProofs = proofs.filter((_, i) => spendable[i]);
  const balance = spendableProofs.reduce((a, c) => a + c.amount, 0);
  return res.json({ error: false, data: balance });
}

export async function claimGetController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    res.status(401);
    return next(new Error("Missing Authorization Header"));
  }
  const isAuth = await verifyAuth(
    authHeader,
    `${process.env.HOSTNAME}/api/v1/claim`,
    "GET",
  );
  if (!isAuth.authorized) {
    res.status(401);
    return next(new Error("Invalid Authorization Header"));
  }
  const user = await User.getUserByPubkey(isAuth.data.pubkey);
  let allClaims: Claim[];
  if (user) {
    const userClaims = await Claim.getUserClaims(user.name);
    const npubClaims = await Claim.getUserClaims(isAuth.data.npub);
    allClaims = [...userClaims, ...npubClaims];
  } else {
    allClaims = await Claim.getUserClaims(isAuth.data.npub);
  }
  const proofs = allClaims.map((claim) => claim.proofs).flat();
  const payload = { proofs: proofs.map((p) => ({ secret: p.secret })) };
  const { spendable } = await new CashuMint(process.env.MINTURL!).check(
    payload,
  );
  const spendableProofs = proofs.filter((_, i) => spendable[i]);
  const token = getEncodedToken({
    memo: "",
    token: [{ mint: process.env.MINTURL!, proofs: spendableProofs }],
  });
  if (spendableProofs.length === 0) {
    return res.json({ error: true, message: "No proofs to claim" });
  }
  res.json({ error: false, data: { token: token } });
}
