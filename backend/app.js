import express from "express";
import cors from "cors";
import connectDB from "./DB/Database.js";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import transactionRoutes from "./Routers/Transactions.js";
import userRoutes from "./Routers/userRouter.js";
import aiRoutes from "./Routers/aiRouter.js";

dotenv.config();

const requiredEnvVars = ["MONGO_URI"];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error(
    `[startup] Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  process.exit(1);
}

const app = express();

const vercelFrontend =
  "https://budget-buddy-frontend-git-main-spartanopjods-projects.vercel.app";

const allowedOrigins = [
  "http://localhost:3000",
  vercelFrontend,
  ...(process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : []),
].filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

console.log("[startup] Connecting to MongoDB...");
await connectDB();

const port = Number(process.env.PORT) || 5001;

app.use(express.json());
app.use(cors(corsOptions));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// API routes
app.use("/api/auth", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/ai", aiRoutes);

// Backward compatibility for existing clients still using /api/v1.
app.use("/api/v1", transactionRoutes);

app.get("/", (req, res) => {
  res.send("Budget Buddy Backend is running successfully.");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`[startup] Server listening on port ${port}`);
  console.log(`[startup] CORS allowed origins: ${allowedOrigins.join(", ")}`);
});
