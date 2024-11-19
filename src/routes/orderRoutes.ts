import express from "express";
import { newOrder } from "../controllers/orderController.js";

const app = express.Router();

// /api/v1/order,new
app.post("/new", newOrder);

export default app;
