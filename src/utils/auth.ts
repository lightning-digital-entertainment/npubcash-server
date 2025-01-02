import { nip19, nip98 } from "nostr-tools";
import jwt from "jsonwebtoken";
import { AuthData } from "../types";

export async function verifyAuth(
  authHeader: string,
  url: string,
  method: string,
  body?: any,
): Promise<AuthData> {
  try {
    if (authHeader.startsWith("Nostr") || authHeader.startsWith("nostr")) {
      let isValid: boolean;
      const event = await nip98
        .unpackEventFromToken(authHeader)
        .catch((err) => {
          throw err;
        });
      if (Boolean(body) && Object.keys(body).length > 0) {
        isValid = await nip98.validateEvent(event, url, method, body);
      } else {
        isValid = await nip98.validateEvent(event, url, method);
      }
      if (!isValid) {
        return { authorized: false };
      }
      return {
        authorized: true,
        data: { pubkey: event.pubkey, npub: nip19.npubEncode(event.pubkey) },
      };
    } else if (authHeader.startsWith("Bearer")) {
      const [_, token] = authHeader.split(" ");
      const parsedHeader = jwt.verify(token, process.env.JWT_SECRET!) as {
        pubkey: string;
      };
      if (!parsedHeader.pubkey) {
        return { authorized: false };
      }
      const data = {
        authorized: true,
        data: {
          pubkey: parsedHeader.pubkey,
          npub: nip19.npubEncode(parsedHeader.pubkey),
        },
      };
      return data;
    } else {
      return { authorized: false };
    }
  } catch (e) {
    return { authorized: false };
  }
}
