import app from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

app.listen(env.PORT, () => {
  logger.info(`CLZLY API is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});
