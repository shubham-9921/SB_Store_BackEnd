import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: [true, "Please Enter Coupon Code"],
  },
  amount: {
    type: Number,
    required: [true, "Please Enter Amount"],
  },
});

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
