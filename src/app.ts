import express from "express";
import { connnectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/Error.js";
import userRoute from "./routes/user.js";
import productRoute from "./routes/productRoutes.js";
import NodeCache from "node-cache";
import { config } from "dotenv";
import morgan from "morgan";

config({
  path: "./.env",
});
const mongoURI = process.env.MONGO_URI || "";
const port = process.env.PORT || 4000;

connnectDB(mongoURI);
const app = express();
app.use(express.json());
app.use(morgan("dev"));

export const nodeCache = new NodeCache();

// User Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);

app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.status(200).json({ msg: "Server is running on port 4000" });
});

app.use(errorMiddleware);
app.listen(port, () => {
  console.log(`Server is Runnig of port ${port}`);
});
