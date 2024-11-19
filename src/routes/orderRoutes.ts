import express from "express";
import {
  allOrders,
  deleteOrder,
  getOrderdetails,
  myOrder,
  newOrder,
  processOrder,
} from "../controllers/orderController.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

// /api/v1/order/new
app.post("/new", newOrder);

// /api/v1/order/myorder
app.get("/myorder", myOrder);

// /api/v1/order/myorder
app.get("/all", adminOnly, allOrders);

// /api/v1/order/:id
app
  .route("/:id")
  .get(getOrderdetails)
  .put(adminOnly, processOrder)
  .delete(adminOnly, deleteOrder);

export default app;
