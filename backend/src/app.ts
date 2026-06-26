import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import healthRoutes from "./routes/health.routes";
import devRoutes from "./routes/dev.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import { requestLogger } from "./utils/logger";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true
  })
);
app.use(requestLogger);

app.use("/api/health", healthRoutes);

if (env.NODE_ENV === "development") {
  app.use("/api/dev", devRoutes);
}

app.use(errorMiddleware);

export default app;
