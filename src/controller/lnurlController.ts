import { lnProvider, wallet } from "@/config";
import { BadRequestError, NotFoundError } from "@/errors";
import { Transaction, User } from "@/models";
import { MintQuote } from "@/models/mint";
import { parseInvoice } from "@/utils/lightning";
import { createLnurlResponse } from "@/utils/lnurl";
import { decodeAndValidateZapRequest } from "@/utils/nostr";
import { createHash } from "crypto";
import { NextFunction, Request, Response } from "express";
import { Event, nip19 } from "nostr-tools";

export async function lnurlController(
  req: Request<
    { user: string },
    unknown,
    unknown,
    { amount?: string; nostr?: string }
  >,
  res: Response,
  next: NextFunction,
) {
  try {
    const { amount, nostr } = req.query;
    const userParam = req.params.user;
    let zapRequest: Event | undefined;

    const userdata = await extractUserdataFromUserParam(userParam);

    if (!amount) {
      const lnurlResponse = createLnurlResponse(userdata.username);
      return res.json(lnurlResponse);
    }
    const parsedAmount = parseInt(amount);
    if (!isValidAmount(parsedAmount)) {
      throw new BadRequestError("Invalid amount");
    }

    if (nostr) {
      try {
        zapRequest = decodeAndValidateZapRequest(nostr, amount);
      } catch (e) {
        throw new BadRequestError("Invalid zap request");
      }
    }
    const { request, quote, expiry } = await wallet.createMintQuote(
      Math.floor(parsedAmount / 1000),
    );
    await MintQuote.createNewMintQuoteInDb(
      { quote, request, expiry },
      userdata.mintUrl,
    );

    const { amount: mintAmount } = parseInvoice(request);

    const invoiceRes = await lnProvider.createInvoice(
      mintAmount / 1000,
      "Cashu Address",
      zapRequest
        ? createHash("sha256").update(JSON.stringify(zapRequest)).digest("hex")
        : undefined,
    );

    await Transaction.createTransaction(
      request,
      quote,
      invoiceRes.paymentRequest,
      invoiceRes.paymentHash,
      userdata.username,
      zapRequest,
      parsedAmount / 1000,
    );
    res.json({
      pr: invoiceRes.paymentRequest,
      routes: [],
    });
  } catch (e) {
    next(e);
  }
}

async function extractUserdataFromUserParam(userParam: string): Promise<{
  username: string;
  pubkey: string;
  isNpub: boolean;
  mintUrl: string;
}> {
  if (userParam.startsWith("npub")) {
    const decoded = nip19.decode(userParam as `npub1${string}`);
    return {
      username: userParam,
      pubkey: decoded.data,
      isNpub: true,
      mintUrl: process.env.MINTURL!,
    };
  } else {
    const userObj = await User.getUserByName(userParam.toLowerCase());
    if (!userObj) {
      throw new NotFoundError("User not found.");
    }
    return {
      username: userObj.name,
      pubkey: userObj.pubkey,
      isNpub: false,
      mintUrl: userObj.mint_url,
    };
  }
}

function isValidAmount(amount: number) {
  return (
    amount < Number(process.env.LNURL_MAX_AMOUNT) ||
    amount > Number(process.env.LNURL_MIN_AMOUNT) ||
    Number.isInteger(amount)
  );
}
