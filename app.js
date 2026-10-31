import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";

const app = express();

const configuredOrigins = [process.env.CLIENT_ORIGIN, process.env.CLIENT_ORIGINS]
  .filter(Boolean)
  .flatMap((origins) => origins.split(","))
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://krishnasoftwarefrontend.vercel.app",
  ...configuredOrigins,
]);

const connectDatabase = async (req, _res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
};

app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin));
  },
  credentials: true,
}));
app.use(express.json({ limit: "15mb" }));

app.get("/", (_, res) => res.json({ message: "Backend is working properly." }));
app.use("/api/auth", connectDatabase, authRoutes);
app.use("/api/documents", connectDatabase, documentRoutes);
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

app.use((_, res) => res.status(404).json({ message: "Route not found." }));

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

export default app;
