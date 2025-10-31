import express from "express";
import cors from "cors";
import connectDB from "./DB/Database.js";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import transactionRoutes from "./Routers/Transactions.js";
import userRoutes from "./Routers/userRouter.js";

dotenv.config();
const app = express();

// Connect to MongoDB
connectDB();

const port = process.env.PORT || 5001;

// ✅ Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",
  "https://budget-buddy-frontend-olive.vercel.app",
  "https://budget-buddy-frontend-git-main-spartanopjods-projects.vercel.app",
  "https://budget-buddy-frontend-63vqm6qa7-spartanopjods-projects.vercel.app"
];


// Middleware
app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.use("/api/v1", transactionRoutes);
app.use("/api/auth", userRoutes);

app.get("/", (req, res) => {
  res.send("✅ Budget Buddy Backend is running successfully!");
});

// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server is live and listening on port ${port}`);
});
