import app from "./app";
import { setupDatabase, setupStore } from "./utils/database";
import { Analyzer } from "./utils/analytics";
import ws from "ws";
import { useWebSocketImplementation } from "nostr-tools/pool";

useWebSocketImplementation(ws);
setupStore();
setInterval(
  () => {
    Analyzer.getInstance().logAnalytics();
  },
  60 * 1 * 1000,
);

async function startServer() {
  try {
    await setupDatabase();
  } catch (e) {
    console.warn("Database Migrations failed!!");
    console.log(e);
    process.exit(1);
  }
  // try {
  //   await setupCallbacks();
  // } catch (e) {
  //   console.warn("Failed to setup callbacks...");
  //   console.log(e);
  //   process.exit(1);
  // }
  console.log("starting server...");
  app.listen(process.env.PORT || 8000);
}

startServer();
