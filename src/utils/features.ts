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

export const invalidateCache = ({
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
    nodeCache.del([
      "adminStats",
      "adminCharts",
      "adminBarCharts",
      "adminLineCharts",
    ]);
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

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;

  const percentage = (thisMonth / lastMonth) * 100;

  return Number(percentage.toFixed(0));
};

export const getInventory = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCoutPromise = categories.map((category) =>
    Product.countDocuments({ category })
  );

  const categoriesCout = await Promise.all(categoriesCoutPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    {
      categoryCount.push({
        [category]: Math.round((categoriesCout[i] / productsCount) * 100),
      });
    }
  });

  return categoryCount;
};

interface MyDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
}
type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: "discount" | "total";
};

export const getChartData = ({
  length,
  docArr,
  today,
  property,
}: FuncProps) => {
  const data: number[] = new Array(length).fill(0);
  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
    if (monthDiff < length) {
      if (property) {
        data[length - monthDiff - 1] += i[property]!;
      } else {
        data[length - monthDiff - 1] += 1;
      }
    }
  });
  return data;
};
