import express from "express";
import {
  deleteProduct,
  getAdminProducts,
  getAllProducts,
  getCategories,
  getLatestProduct,
  getSingleProduct,
  newProduct,
  updateSingleProduct,
} from "../controllers/productController.js";
import { singleUpload } from "../middlewares/multer.js";
import { adminOnly } from "../middlewares/auth.js";
const app = express.Router();

// Create New Product :- /api/v1/product/new
app.post("/new", adminOnly, singleUpload, newProduct);

// Get Latest Products :-  /api/v1/product/latest
app.get("/latest", getLatestProduct);

// Get All Categories :-   /api/v1/product/category
app.get("/category", getCategories);

//  Get All Products :-  /api/v1/product/category
app.get("/admin-products", adminOnly, getAdminProducts);

// Filter And sort
app.get("/all", getAllProducts);
// app.get("/category", getCategories);

// Get Single Product ,Update,Delete  :- /api/v1/product/:id
app
  .route("/:id")
  .get(getSingleProduct)
  .put(adminOnly, singleUpload, updateSingleProduct)
  .delete(adminOnly, deleteProduct);

export default app;
