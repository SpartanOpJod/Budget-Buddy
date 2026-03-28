import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./DB/Database.js";
import aiRoutes from "./Routers/aiRouter.js";
import transactionRoutes from "./Routers/Transactions.js";
import userRoutes from "./Routers/userRouter.js";

const app = express();
const port = Number(process.env.PORT) || 5001;

const normalizeOrigin = (origin = "") => origin.trim().replace(/\/+$/, "");

const wildcardToRegex = (originPattern) => {
  const escaped = originPattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\*/g, ".*")}$`);
};

const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGINS,
  process.env.FRONTEND_URLS,
]
  .filter(Boolean)
  .flatMap((entry) => entry.split(","))
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

const defaultDevOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

const exactAllowedOrigins = new Set(
  [...defaultDevOrigins, ...configuredOrigins].filter((origin) => !origin.includes("*"))
);

const wildcardAllowedOrigins = [...configuredOrigins]
  .filter((origin) => origin.includes("*"))
  .map(wildcardToRegex);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);
    const isExactMatch = exactAllowedOrigins.has(normalizedOrigin);
    const isWildcardMatch = wildcardAllowedOrigins.some((regex) =>
      regex.test(normalizedOrigin)
    );

    if (isExactMatch || isWildcardMatch) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${normalizedOrigin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Budget Buddy backend is running",
  });
});

app.use("/api/auth", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/v1", transactionRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("[error]", err.stack || err.message);
  return res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not configured");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    await connectDB();
    app.listen(port, "0.0.0.0", () => {
      console.log(`[startup] Server listening on port ${port}`);
      console.log(
        `[startup] Allowed CORS origins: ${[...exactAllowedOrigins].join(", ")}`
      );
      if (wildcardAllowedOrigins.length > 0) {
        console.log(
          `[startup] Allowed CORS wildcard patterns: ${configuredOrigins
            .filter((origin) => origin.includes("*"))
            .join(", ")}`
        );
      }
    });
  } catch (error) {
    console.error(`[startup] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
