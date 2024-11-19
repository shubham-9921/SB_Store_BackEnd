import mongoose from "mongoose";
import { invalidateType, OrderItemType } from "../types/types.js";
import Product from "../models/Product.js";
import ErrorHandler from "./utils-classes.js";
import Order from "../models/Orders.js";
import { nodeCache } from "../app.js";

export const connnectDB = (uri: string) =>
  mongoose
    .connect(uri, {
      dbName: "Ecommerce24",
    })
    .then((c) => console.log(`Database Connected to ${c.connection.host}`))
    .catch((e) => {
      console.log(e);
    });

export const invalidateCache = async ({
  product,
  order,
  admin,
  userId,
  orderId,
  productId,
}: invalidateType) => {
  if (product) {
    const productKey: string[] = [
      "latestProducts",
      "category",
      "adminProduct",
      `product-${productId}`,
    ];

    if (typeof productId === "string") productKey.push(`product-${productId}`);

    if (typeof productId === "object")
      productId.forEach((i) => productKey.push(`product-${i}`));

    nodeCache.del(productKey);
  }

  if (order) {
    const orderKey: string[] = [
      "allOrders",
      `myOrders-${userId}`,
      `order-${orderId}`,
    ];
    nodeCache.del(orderKey);
  }
  if (admin) {
  }
};

export const reduceStock = async (orderItems: OrderItemType[]) => {
  for (let index = 0; index < orderItems.length; index++) {
    const order = orderItems[index];
    const product = await Product.findById(order.productId);

    if (!product) throw new ErrorHandler("Product Not found", 404);
    product.stock -= order.quantity;
    await product.save();
  }
};
