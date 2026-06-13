import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import proxyRoutes from "./routes/proxyRoutes";

const app = express();

// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerStorageProxy(app);
registerOAuthRoutes(app);

// Proxy routes for Brazilian residential proxy streaming
app.use("/api/proxy", proxyRoutes);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Global Error Handler]", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    error: true,
    message: err.message || "An unexpected error occurred",
  });
});

export { app };
