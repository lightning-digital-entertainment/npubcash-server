import { queryWrapper } from "@/utils/database";

export class MintQuote {
  private constructor(
    public id: number,
    public created_at: number,
    public mint_url: string,
    public payment_request: string,
    public quote_id: string,
    public expires_at: string,
    public state: "PAID" | "UNPAID" | "ISSUED" | "EXPIRED",
  ) {}

  static async createNewMintQuoteInDb(
    quoteRes: {
      quote: string;
      expiry: number;
      request: string;
    },
    mint_url: string,
  ) {
    const res = await queryWrapper(
      `INSERT INTO mintQuotes (mint_url, payment_request, quote_id, expires_at, state) VALUES ($1, $2, $3, $4, $5)`,
      [mint_url, quoteRes.request, quoteRes.quote, quoteRes.expiry, "UNPAID"],
    );
    if (res.rowCount === 0) {
      throw new Error("Failed to create new mint quote");
    }
  }

  async setStateAndUpdateDb(newState: "PAID" | "ISSUED" | "EXPIRED") {
    const query = `UPDATE mintQuotes SET state = $1 WHERE id = $2`;
    const res = await queryWrapper(query, [newState, this.id]);
    if (res.rowCount === 0) {
      throw new Error("Failed to update state");
    }
    this.state = newState;
  }
}
