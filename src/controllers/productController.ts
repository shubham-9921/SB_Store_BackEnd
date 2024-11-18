import { NextFunction, Request, Response } from "express";
import { tryCatch } from "../middlewares/Error.js";
import Product from "../models/Product.js";
import ErrorHandler from "../utils/utils-classes.js";
import { faker } from "@faker-js/faker";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../types/types.js";
import { rm } from "fs";
import { nodeCache } from "../app.js";
import { invalidateCache } from "../utils/features.js";

// Revalidate NEw Update Delete Product and NEW Order
export const getLatestProduct = tryCatch(async (req, res, next) => {
  let products;

  if (nodeCache.has("latestProducts")) {
    products = JSON.parse(nodeCache.get("latestProducts") as string);
  } else {
    products = await Product.find().sort({ createdAt: -1 }).limit(5);
    nodeCache.set("latestProducts", JSON.stringify(products));
  }

  if (!products) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  return res.status(200).json({
    success: true,
    products,
  });
});

// Revalidate NEw Update Delete Product and NEW Order
export const getCategories = tryCatch(async (req, res, next) => {
  let category;

  if (nodeCache.has("category")) {
    category = JSON.parse(nodeCache.get("category") as string);
  } else {
    category = await Product.distinct("category");
    nodeCache.set("category", JSON.stringify(category));
  }

  if (!category) {
    return next(new ErrorHandler("No category found", 404));
  }

  return res.status(200).json({
    success: true,
    category,
  });
});

// Revalidate NEw Update Delete Product and NEW Order
export const getAdminProducts = tryCatch(async (req, res, next) => {
  let products;

  if (nodeCache.has("adminProduct")) {
    products = JSON.parse(nodeCache.get("adminProduct") as string);
  } else {
    products = await Product.find();
    nodeCache.set("adminProduct", JSON.stringify(products));
  }

  if (!products) {
    return next(new ErrorHandler("No Products", 404));
  }
  return res.status(200).json({
    success: true,
    products,
  });
});

// Revalidate NEw Update Delete Product and NEW Order
export const getSingleProduct = tryCatch(async (req, res, next) => {
  let product;
  const { id } = req.params;

  if (nodeCache.has(`product-${id}`)) {
    product = JSON.parse(nodeCache.get(`product-${id}`) as string);
  } else {
    product = await Product.findById(id);
    nodeCache.set(`product-${id}`, JSON.stringify(product));
  }

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  return res.status(200).json({
    success: true,
    product,
  });
});

export const newProduct = tryCatch(
  async (
    req: Request<{}, {}, NewProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, price, stock, category } = req.body;

    const photo = req.file;
    if (!photo) return next(new ErrorHandler("Please upload a photo", 400));

    if (!name || !price || !stock || !category) {
      rm(photo.path, () => {
        console.log("Photo Deleted");
      });

      return next(new ErrorHandler("Please fill all fields", 400));
    }

    const product = await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: photo?.path,
    });

    invalidateCache({ product: true });

    if (!product) {
      return next(new ErrorHandler("Error in creating product", 400));
    }

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
    });
  }
);

export const updateSingleProduct = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const { name, price, stock, category } = req.body;
  const photo = req.file;

  const product = await Product.findById(id);

  invalidateCache({ product: true });

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  if (photo) {
    rm(product.photo, () => {
      console.log("Old photo deleted");
      product.photo = photo.path;
    });
  }

  if (name) product.name = name;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (category) product.category = category;

  console.log(req.body);

  await product.save();

  return res.status(200).json({
    success: true,
    message: "Product Updated Successfully",
    product,
  });
});

export const deleteProduct = tryCatch(async (req, res, next) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  rm(product.photo, () => {
    console.log("Product photo deleted");
  });

  await product.deleteOne();

  invalidateCache({ product: true });

  return res.status(200).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});

export const getAllProducts = tryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;
    const page = Number(req.query.page) || 1;

    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;

    const baseQuery: BaseQuery = {};

    if (search) baseQuery.name = { $regex: search, $options: "i" };

    if (price) baseQuery.price = { $lte: Number(price) };

    if (category) baseQuery.category = category;

    const productsPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, filterOnlyProduct] = await Promise.all([
      productsPromise,
      Product.find(baseQuery),
    ]);

    const totalPages = Math.ceil(filterOnlyProduct.length / limit);

    return res.status(200).json({
      success: true,
      products,
      totalPages,
    });
  }
);

// const generateProduct = async (count: number = 10) => {
//   const products = [];

//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       photo: "uploads\\d4274486-c8da-4211-891b-cb4ab19cd8d8.jpeg",
//       price: faker.commerce.price({ min: 1500, max: 8000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       __v: 0,
//     };

//     products.push(product);
//   }

//   await Product.create(products);

//   console.log({ success: true });
// };
