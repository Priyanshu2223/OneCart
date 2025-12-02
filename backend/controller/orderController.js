import Order from "../model/orderModel.js";
import User from "../model/userModel.js";
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
dotenv.config();

const currency = 'inr';

// ensure keys are present at startup — log if missing
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('⚠️ Razorpay keys missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment.');
}

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ========================= USER: PLACE ORDER (COD) =========================
export const placeOrder = async (req, res) => {
  try {
    const { items, amount, address } = req.body;
    const userId = req.userId;

    const newOrder = new Order({
      items,
      amount,
      userId,
      address,
      paymentMethod: 'COD',
      payment: false,
      date: Date.now(),
      status: "Order Placed"
    });

    await newOrder.save();
    await User.findByIdAndUpdate(userId, { cartData: {} });

    return res.status(201).json({ message: 'Order Placed Successfully' });
  } catch (error) {
    console.log('placeOrder error:', error);
    res.status(500).json({ message: 'Order placement error' });
  }
};

// ========================= USER: PLACE ORDER (RAZORPAY) =========================
export const placeOrderRazorpay = async (req, res) => {
  try {
    const { items, amount, address } = req.body;
    const userId = req.userId;

    const newOrder = new Order({
      items,
      amount,
      userId,
      address,
      paymentMethod: 'Razorpay',
      payment: false,
      date: Date.now(),
      status: "Order Placed"
    });

    await newOrder.save();

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: (currency || 'INR').toUpperCase(),
      receipt: newOrder._id.toString()
    };

    razorpayInstance.orders.create(options, (error, order) => {
      if (error) {
        console.error('razorpay.orders.create error:', error);
        return res.status(500).json({ message: 'Razorpay order creation failed', error });
      }
      // send order back to client (contains id, amount, currency)
      return res.status(200).json(order);
    });

  } catch (error) {
    console.log('placeOrderRazorpay error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========================= VERIFY RAZORPAY PAYMENT =========================
export const verifyRazorpay = async (req, res) => {
  try {
    const userId = req.userId;
    const { razorpay_order_id } = req.body;

    if (!razorpay_order_id) {
      return res.status(400).json({ message: 'Missing razorpay_order_id' });
    }

    // fetch the order from Razorpay to confirm status
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo && orderInfo.status === 'paid') {
      await Order.findByIdAndUpdate(orderInfo.receipt, { payment: true });
      await User.findByIdAndUpdate(userId, { cartData: {} });

      return res.status(200).json({ message: 'Payment Successful' });
    } else {
      console.warn('verifyRazorpay: payment not completed', orderInfo);
      return res.status(400).json({ message: 'Payment not completed' });
    }
  } catch (error) {
    console.error('verifyRazorpay error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========================= USER: GET USER ORDERS =========================
export const userOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await Order.find({ userId });
    return res.status(200).json(orders);
  } catch (error) {
    console.log('userOrders error:', error);
    return res.status(500).json({ message: "userOrders error" });
  }
};

// ========================= ADMIN: GET ALL ORDERS =========================
export const allOrders = async (req, res) => {
  try {
    const orders = await Order.find({});
    res.status(200).json(orders);
  } catch (error) {
    console.log('allOrders error:', error)
    res.status(500).json({ message: "adminAllOrders error" });
  }
};

// ========================= ADMIN: UPDATE ORDER STATUS =========================
export const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const allowedStatus = [
      "Order Placed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Refund Processing",
      "Refunded"
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    await Order.findByIdAndUpdate(orderId, { status });
    return res.status(200).json({ message: "Status Updated" });

  } catch (error) {
    console.error('updateStatus error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// ========================= USER: CANCEL ORDER =========================
export const cancelOrder = async (req, res) => {
  const { orderId } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json("Order not found");
    }

    if (order.status === "Delivered") {
      return res.status(400).json("Delivered orders cannot be cancelled");
    }

    if (["Shipped", "Out for Delivery"].includes(order.status)) {
      return res.status(400).json("Order already being shipped");
    }

    if (order.paymentMethod === "Razorpay") {
      order.status = "Refund Processing";
    } else {
      order.status = "Cancelled";
    }

    await order.save();
    return res.status(200).json("Order cancelled successfully");

  } catch (error) {
    console.log('cancelOrder error:', error);
    res.status(500).json("Internal server error");
  }
};
