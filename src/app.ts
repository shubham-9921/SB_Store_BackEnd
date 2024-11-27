import express from "express";
import { connnectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/Error.js";
import NodeCache from "node-cache";
import { config } from "dotenv";
import morgan from "morgan";
import cors from "cors";
import { Stripe } from "stripe";

// Importing Routes
import userRoute from "./routes/user.js";
import productRoute from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import dashboardRoutes from "./routes/stats.js";

config({
  path: "./.env",
});
const mongoURI = process.env.MONGO_URI || "";
const stripeKey = process.env.STRIPE_KEY || "";
const port = process.env.PORT || 4000;

connnectDB(mongoURI);
const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

export const stripe = new Stripe(stripeKey);

export const nodeCache = new NodeCache();

// User Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.status(200).json({ msg: "Server is running on port 4000" });
});
// await generateProduct(10);

app.use(errorMiddleware);
app.listen(port, () => {
  console.log(`Server is Runnig of port ${port}`);
});
