import mongoose from "mongoose";
import { trim } from "validator";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter Name"],
    },
    photo: {
      type: String,
      required: [true, "Please Add photo"],
    },
    price: {
      type: Number,
      required: [true, "Please Enter price"],
    },
    stock: {
      type: Number,
      required: [true, "Please Enter stock"],
    },
    category: {
      type: String,
      required: [true, "Please Enter category"],
      trim: true,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
