import { stripe } from "../app.js";
import { tryCatch } from "../middlewares/Error.js";
import Coupon from "../models/Coupon.js";
import ErrorHandler from "../utils/utils-classes.js";

export const createStripeIntent = tryCatch(async (req, res, next) => {
  const { amount } = req.body;
  if (!amount) {
    return next(new ErrorHandler("Please Enter Amount", 400));
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(amount) * 100,
    currency: "inr",
  });

  return res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

export const createCoupon = tryCatch(async (req, res, next) => {
  const { couponCode, amount } = req.body;
  if (!couponCode || !amount) {
    return next(new ErrorHandler("Please Enter All Fields", 400));
  }

  const coupon = await Coupon.create({ couponCode, amount });
  return res.status(200).json({
    success: true,
    message: "Coupon created successfully",
  });
});

export const applyDiscount = tryCatch(async (req, res, next) => {
  const { couponCode } = req.query;

  let discount: number = 0;

  if (!couponCode) {
    return next(new ErrorHandler("Please Enter All Fields", 400));
  }

  const coupon = await Coupon.findOne({ couponCode });

  if (!coupon) {
    return next(new ErrorHandler("Coupon is not valid", 400));
  }

  if (coupon) {
    discount = coupon.amount;
  }

  return res.status(200).json({
    success: true,
    message: "Coupon Applied",
    discount,
  });
});

export const getAllCoupons = tryCatch(async (req, res, next) => {
  const coupons = await Coupon.find();

  if (!coupons) {
    return next(new ErrorHandler("Coupon Not Found", 400));
  }

  return res.status(200).json({
    success: true,
    coupons,
  });
});
export const deleteCoupon = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    return next(new ErrorHandler("Coupon Not Found", 400));
  }

  await coupon.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Coupon Deleted Successfully",
  });
});
