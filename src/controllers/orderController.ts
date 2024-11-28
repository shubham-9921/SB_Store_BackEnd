import { NextFunction, Request, Response } from "express";
import { tryCatch } from "../middlewares/Error.js";
import { NewOrderReqBody } from "../types/types.js";
import Order from "../models/Orders.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utils-classes.js";
import { nodeCache } from "../app.js";

export const newOrders = tryCatch(async (req: any, res: any, next) => {
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
  if (!shippingInfo || !orderItems || !user || !subtotal || !tax) {
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

  invalidateCache({
    product: true,
    order: true,
    admin: true,
    userId: user,
    productId: String(order.orderItems.map((i) => i._id)),
  });

  return res.status(200).json({
    success: true,
    message: "Order place successfully",
  });
});

export const myOrder = tryCatch(async (req, res, next) => {
  const { userId } = req.query;

  let order;

  if (nodeCache.has(`myOrders-${userId}`)) {
    order = JSON.parse(nodeCache.get(`myOrders-${userId}`) as string);
  } else {
    order = await Order.find({ user: userId });
    nodeCache.set(`myOrders-${userId}`, JSON.stringify(order));
  }

  if (!order) {
    return next(new ErrorHandler("Order not Found", 404));
  }

  return res.status(200).json({
    success: true,
    order,
  });
});

export const allOrders = tryCatch(async (req, res, next) => {
  let orders;

  if (nodeCache.has("allOrders")) {
    orders = JSON.parse(nodeCache.get("allOrders") as string);
  } else {
    orders = await Order.find({}).populate("user", "name");

    nodeCache.set("allOrders", JSON.stringify(orders));
  }

  if (!orders) {
    return next(new ErrorHandler("No Orders Found", 404));
  }

  return res.status(200).json({
    success: true,
    orders,
  });
});

export const getOrderdetails = tryCatch(async (req, res, next) => {
  const { id } = req.params;
  let order;
  let cacheKey = `order-${id}`;

  if (nodeCache.has(cacheKey)) {
    order = JSON.parse(nodeCache.get(cacheKey) as string);
  } else {
    order = await Order.findById(id).populate("user", "name");
    nodeCache.set(cacheKey, JSON.stringify(order));
  }

  if (!order) {
    return next(new ErrorHandler("Order not Found", 404));
  }

  return res.status(200).json({
    success: true,
    order,
  });
});

export const processOrder = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) {
    return next(new ErrorHandler("Order not Found", 404));
  }

  console.log(order.status);
  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    default:
      order.status = "Delivered";
      break;
  }

  await order.save();

  invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: "Order Processed Successfully",
  });
});

export const deleteOrder = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) {
    return next(new ErrorHandler("Order not Found", 404));
  }

  await order.deleteOne();

  invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: "Order Deleted Successfully",
  });
});
