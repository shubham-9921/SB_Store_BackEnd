import { nodeCache } from "../app.js";
import { tryCatch } from "../middlewares/Error.js";
import Order from "../models/Orders.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import {
  calculatePercentage,
  getChartData,
  getInventory,
} from "../utils/features.js";

export const getDasboardStats = tryCatch(async (req, res, next) => {
  let stats;
  let cacheKey = "adminStats";

  if (nodeCache.has(cacheKey)) {
    stats = JSON.parse(nodeCache.get(cacheKey) as string);
  } else {
    const today = new Date();

    const lastMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0),
    };
    const thisMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };

    const sixMonthAgo = new Date();
    sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

    // Product Percentage
    const lastMonthProductsPromise = Product.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthProductsPromise = Product.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    // Order Percentage

    const lastMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    // User Percentage

    const lastMonthUsersPromise = User.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthUsersPromise = User.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    const lastSixMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: sixMonthAgo,
        $lte: today,
      },
    });

    const latestTransactionPromise = Order.find()
      .select(["discount", "amount", "total", "orderItems"])
      .limit(4);

    const [
      lastMonthProducts,
      thisMonthProducts,
      lastMonthOrders,
      thisMonthOrders,
      lastMonthUsers,
      thisMonthUsers,
      productsCount,
      usersCount,
      ordersCount,
      lastSixMonthOrders,
      categories,
      femaleUsers,
      latestTransaction,
    ] = await Promise.all([
      lastMonthProductsPromise,
      thisMonthProductsPromise,
      lastMonthOrdersPromise,
      thisMonthOrdersPromise,
      lastMonthUsersPromise,
      thisMonthUsersPromise,
      Product.countDocuments(),
      User.countDocuments(),
      Order.find({}).select("total"),
      lastSixMonthOrdersPromise,
      Product.distinct("category"),
      User.find({ gender: "female" }).countDocuments(),
      latestTransactionPromise,
    ]);

    const thisMonthRevenue = thisMonthOrders.reduce(
      (total, order) => total + order.total || 0,
      0
    );
    const lastMonthRevenue = lastMonthOrders.reduce(
      (total, order) => total + order.total || 0,
      0
    );

    const percentage = {
      revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
      product: calculatePercentage(
        thisMonthProducts.length,
        lastMonthProducts.length
      ),
      order: calculatePercentage(
        thisMonthOrders.length,
        lastMonthOrders.length
      ),
      user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
    };

    const count = {
      products: productsCount,
      users: usersCount,
      orders: ordersCount.length,
    };

    // Graph
    const orderMonthsCount = new Array(6).fill(0);
    const orderMonthsRevenue = new Array(6).fill(0);

    lastSixMonthOrders.forEach((order) => {
      const creationDate = order.createdAt;
      const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

      if (monthDiff < 6) {
        orderMonthsCount[6 - monthDiff - 1] += 1;
        orderMonthsRevenue[6 - monthDiff - 1] += order.total;
      }
    });

    // Intentory Category
    // const categoriesCoutPromise = categories.map((category) =>
    //   Product.countDocuments({ category })
    // );

    // const categoriesCout = await Promise.all(categoriesCoutPromise);
    // const categoryCount: Record<string, number>[] = [];
    // categories.forEach((category, i) => {
    //   {
    //     categoryCount.push({
    //       [category]: Math.round((categoriesCout[i] / productsCount) * 100),
    //     });
    //   }
    // });

    const categoryCount = await getInventory({ categories, productsCount });

    // Gender Ration
    const gender = {
      male: usersCount - femaleUsers,
      female: femaleUsers,
    };

    // Latest Transaction
    const modifiedLatestTransactions = latestTransaction.map((i) => ({
      _id: i.id,
      discount: i.discount,
      amount: i.total,
      qunatity: i.orderItems.length,
      status: i.status,
    }));

    stats = {
      changeInPercent: percentage,
      count,
      chart: {
        orderMonthsCount,
        orderMonthsRevenue,
      },
      categoryCount,
      gender,
      modifiedLatestTransactions,
    };

    nodeCache.set(cacheKey, JSON.stringify(stats));
  }

  return res.status(200).json({
    success: true,
    stats,
  });
});

export const getPieCharts = tryCatch(async (req, res, next) => {
  let charts;
  let cacheKey = "adminCharts";

  if (nodeCache.has(cacheKey)) {
    charts = JSON.parse(nodeCache.get(cacheKey) as string);
  } else {
    const allOrdersPromise = Order.find().select([
      "discount",
      "tax",
      "shippingCharges",
      "total",
      "subtotal",
    ]);
    const [
      Processing,
      Shipped,
      Delivered,
      categories,
      productsCount,
      productOutStock,
      allOrders,
      adminUsers,
      customerUsers,
      allUsers,
    ] = await Promise.all([
      Order.find({ status: "Processing" }),
      Order.find({ status: "Shipped" }),
      Order.find({ status: "Delivered" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      allOrdersPromise,
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
      User.find().select(["dob"]),
    ]);

    const productCategory = await getInventory({ categories, productsCount });

    const stockAvailablity = {
      outStock: productOutStock,
      inStock: productsCount - productOutStock,
    };

    const grossIncome = allOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0
    );

    const discount = allOrders.reduce(
      (prev, order) => prev + (order.discount || 0),
      0
    );

    const productCost = allOrders.reduce(
      (prev, order) => prev + (order.shippingCharges || 0),
      0
    );

    const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);

    const marketingCost = Math.round(grossIncome * (30 / 100));

    const netMargin =
      grossIncome - discount - productCost - burnt - marketingCost;

    const revenueDistribution = {
      netMargin,
      discount,
      productCost,
      burnt,
      marketingCost,
    };

    const userDistribution = {
      adminUsers,
      customerUsers,
    };

    const userAgeGroup = {
      // teen: allOrders.filter((i) => i.age < 20).length,
      // adult: allOrders.filter((i) => i.age > 20  i.age <= 40).length,
      // old: allOrders.filter((i) => i.age > 40).length,

      teen: allUsers.filter((i) => i.age < 20).length,
      adult: allUsers.filter((i) => i.age >= 20 && i.age < 40).length,
      old: allUsers.filter((i) => i.age >= 40).length,
    };
    charts = {
      Processing: Processing.length,
      Shipped: Shipped.length,
      Delivered: Delivered.length,
      productCategory,
      stockAvailablity,
      revenueDistribution,
      userDistribution,
      userAgeGroup,
    };

    nodeCache.set(cacheKey, charts);
  }

  return res.status(200).json({
    success: true,
    charts,
  });
});

export const getBarCharts = tryCatch(async (req, res, next) => {
  let charts;
  let cacheKey = "adminBarCharts";

  if (nodeCache.has(cacheKey)) {
    charts = JSON.parse(nodeCache.get(cacheKey) as string);
  } else {
    const today = new Date();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // const sixMonthProduct = Product.find({
    //   createdAt: {
    //     $gte: sixMonthAgo,
    //     $lte: today,
    //   },
    // }).select("createdAt");
    const sixMonthProductPromise = Product.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const sixMonthUsersPromise = User.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const twelveMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const [products, users, orders] = await Promise.all([
      sixMonthProductPromise,
      sixMonthUsersPromise,
      twelveMonthOrdersPromise,
    ]);

    // const productsCount = getChartData({ length: 6, docArr: products, today });
    // const usersCount = getChartData({ length: 6, docArr: users, today });
    // const ordersCount = getChartData({ length: 6, docArr: orders, today });
    const productCounts = getChartData({ length: 6, today, docArr: products });
    const usersCounts = getChartData({ length: 6, today, docArr: users });
    const ordersCounts = getChartData({ length: 12, today, docArr: orders });

    charts = {
      users: usersCounts,
      products: productCounts,
      orders: ordersCounts,
    };

    nodeCache.set(cacheKey, JSON.stringify(charts));
  }

  return res.status(200).json({
    success: true,
    charts,
  });
});

export const getLineCharts = tryCatch(async (req, res, next) => {
  let charts;
  const key = "adminLineCharts";

  if (nodeCache.has(key)) {
    charts = JSON.parse(nodeCache.get(key)!);
  } else {
    const today = new Date();

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const baseQuery = {
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    };

    const [products, users, orders] = await Promise.all([
      Product.find(baseQuery).select("createdAt"),
      User.find(baseQuery).select("createdAt"),
      Order.find(baseQuery).select(["createdAt", "discount", "total"]),
    ]);

    const productCounts = getChartData({ length: 12, today, docArr: products });
    const usersCounts = getChartData({ length: 12, today, docArr: users });
    const discount = getChartData({
      length: 12,
      today,
      docArr: orders,
      property: "discount",
    });
    const revenue = getChartData({
      length: 12,
      today,
      docArr: orders,
      property: "total",
    });

    charts = {
      users: usersCounts,
      products: productCounts,
      discount,
      revenue,
    };

    nodeCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({
    success: true,
    charts,
  });
});
