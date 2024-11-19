import mongoose from "mongoose";
import { invalidateType, OrderItemType } from "../types/types.js";
import Product from "../models/Product.js";
import ErrorHandler from "./utils-classes.js";

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
}: invalidateType) => {
  if (product) {
    const productKey: String[] = ["latestProducts", "category", "adminProduct"];

    const products = await Product.find({}).select("_id");
    products.forEach((element) => {
      productKey.push(`product-${element.id}`);
    });
  }
  if (order) {
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
