import express from "express";
import {
  allOrders,
  deleteOrder,
  getOrderdetails,
  myOrder,
  newOrders,
  processOrder,
} from "../controllers/orderController.js";
import { adminOnlys } from "../middlewares/auth.js";

const app = express.Router();

// /api/v1/order/new
app.post("/new", newOrders);

// /api/v1/order/myorder
app.get("/myorder", myOrder);

// /api/v1/order/myorder
app.get("/all", adminOnlys, allOrders);

// /api/v1/order/:id
app
  .route("/:id")
  .get(getOrderdetails)
  .put(adminOnly, processOrder)
  .delete(adminOnly, deleteOrder);

export default app;
