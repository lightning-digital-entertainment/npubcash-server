import { Router } from "express";
import { lnurlController } from "./controller/lnurlController";
import { paidController } from "./controller/paidController";
import {
  balanceController,
  claimGetController,
} from "./controller/claimController";
import {
  getInfoController,
  putMintInfoController,
  putUsernameInfoController,
} from "./controller/infoController";
import { isAuthMiddleware } from "./middleware/auth";
import { nip05Controller } from "./controller/nip05Controller";
import {
  getLatestWithdrawalsController,
  getWithdrawalDetailsController,
} from "./controller/withdrawalController";
import v2Router from "./routes/v2";

const routes = Router();
const v1Router = Router();

routes.get("/.well-known/lnurlp/:user", lnurlController);
routes.get("/.well-known/nostr.json", nip05Controller);

v1Router.get(
  "/info",
  isAuthMiddleware(`/api/v1/info`, "GET"),
  getInfoController,
);
v1Router.put(
  "/info/mint",
  isAuthMiddleware(`/api/v1/info/mint`, "PUT"),
  putMintInfoController,
);
v1Router.put(
  "/info/username",
  isAuthMiddleware(`/api/v1/info/username`, "PUT"),
  putUsernameInfoController,
);
v1Router.post("/paid", paidController);
v1Router.get(
  "/claim",
  isAuthMiddleware("/api/v1/claim", "GET"),
  claimGetController,
);
v1Router.get(
  "/balance",
  isAuthMiddleware("/api/v1/balance", "GET"),
  balanceController,
);
v1Router.get(
  "/withdrawals",
  isAuthMiddleware("/api/v1/withdrawals", "GET"),
  getLatestWithdrawalsController,
);

v1Router.get(
  "/withdrawals/:id",
  isAuthMiddleware("/api/v1/withdrawals/:id", "GET"),
  getWithdrawalDetailsController,
);

routes.use("/api/v1", v1Router);
routes.use("/api/v2", v2Router);

export default routes;
