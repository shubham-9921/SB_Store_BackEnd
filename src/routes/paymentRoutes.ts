// create coupun
//app discount
// all coupons
//delete coupun

import express from "express";
import {
  applyDiscount,
  createCoupon,
  deleteCoupon,
  getAllCoupons,
} from "../controllers/paymentController.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

// /api/v1/payment/coupon/new :Create coupun
app.post("/coupon/new", adminOnly, createCoupon);

// /api/v1/payment/coupon/discount :Apply Discount
app.get("/coupon/discount", applyDiscount);

// /api/v1/payment/coupon/all :All Coupons
app.get("/coupon/all", adminOnly, getAllCoupons);

// /api/v1/payment/coupon/:id :Dlete Coupons
app.delete("/coupon/:id", adminOnly, deleteCoupon);

export default app;
