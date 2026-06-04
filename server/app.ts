import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { authRouter } from "./routes/auth";
import { barbersRouter } from "./routes/barbers";
import { dashboardRouter } from "./routes/dashboard";
import { messagesRouter } from "./routes/messages";
import { reservationsRouter } from "./routes/reservations";
import { schedulesRouter } from "./routes/schedules";
import { servicesRouter } from "./routes/services";
import { usersRouter } from "./routes/users";
import { errorHandler, notFound } from "./utils/http";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true
    })
  );
  app.use(express.json({ limit: "5mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/services", servicesRouter);
  app.use("/api/barbers", barbersRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/schedules", schedulesRouter);
  app.use("/api/reservations", reservationsRouter);
  app.use("/api/messages", messagesRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
