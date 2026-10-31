import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "15mb" }));

// Routes
app.get("/", (_, res) => res.json({ message: "Backend is working properly." }));
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// 404 handler
app.use((_, res) => res.status(404).json({ message: "Route not found." }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack || err.message);
  const status = err.status || 500;
  const message = status === 413
    ? "The upload is too large. Maximum file size is 10 MB."
    : status >= 500
      ? "Internal server error."
      : err.message;
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
};

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exit(1);
});
