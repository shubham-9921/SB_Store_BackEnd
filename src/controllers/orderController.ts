import { NextFunction, Request, Response } from "express";
import { tryCatch } from "../middlewares/Error.js";
import { NewOrderReqBody } from "../types/types.js";
import Order from "../models/Orders.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utils-classes.js";

export const newOrder = tryCatch(
  async (
    req: Request<{}, {}, NewOrderReqBody>,
    res: Response,
    next: NextFunction
  ) => {
    const {
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    } = req.body;
    if (
      !shippingInfo ||
      !orderItems ||
      !user ||
      !subtotal ||
      !tax ||
      !shippingCharges ||
      !discount ||
      !total
    ) {
      return new ErrorHandler("Please Enter all field", 404);
    }
    const order = await Order.create({
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    });

    if (!order) {
      return new ErrorHandler("Failed to create order", 404);
    }

    await reduceStock(orderItems);

    invalidateCache({ product: true, order: true, admin: true });

    return res.status(200).json({
      success: true,
      message: "Order place successfully",
    });
  }
);
