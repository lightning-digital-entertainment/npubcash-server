import express, { Response } from "express";
import bodyparser from "body-parser";
import cors from "cors";
import compression from "compression";
import { requireHTTPS } from "./middleware/https";
import path from "path";
import baseRouter from "./routes";

const app = express();

app.use(bodyparser.json());
app.use(compression());
app.use(cors());
app.use(requireHTTPS);

app.use(baseRouter);
app.use(
  "/",
  express.static(path.join(import.meta.dirname, "../npubcash-website/dist")),
);
app.get("*", (_, res: Response) => {
  res.sendFile(
    path.join(import.meta.dirname, "../npubcash-website/dist/index.html"),
  );
});

export default app;
