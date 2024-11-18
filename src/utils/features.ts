import mongoose from "mongoose";
import { invalidateType } from "../types/types.js";
import Product from "../models/Product.js";

export const connnectDB = () =>
  mongoose
    .connect("mongodb://localhost:27017", {
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
