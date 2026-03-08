import { app } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Resolve .env path relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

// Import Handlers
import { setupMainWindow, startHeartbeatLoop } from "./handlers/appController.js";
import { registerAuthHandlers } from "./handlers/authHandlers.js";
import { registerMachineHandlers } from "./handlers/machineHandlers.js";
import { registerPaymentHandlers } from "./handlers/paymentHandlers.js";
import { initSerial } from "./services/serialService.js";

app.on("ready", async () => {
  try {
    // Attempt connecting to the hardware Serial Bus
    await initSerial();

    // Setup window and rendering hook handlers
    const mainWindow = setupMainWindow();

    // 2. Register IPC Routers
    registerAuthHandlers();
    registerMachineHandlers();
    registerPaymentHandlers();

    // 3. Start Background Tasks
    startHeartbeatLoop();

  } catch (e) {
    console.error("Failed to start the application:", e);
    app.quit();
  }
});
