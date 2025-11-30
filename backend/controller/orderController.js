import Order from "../model/orderModel.js";
import User from "../model/userModel.js";
import razorpay from 'razorpay'
import dotenv from 'dotenv'
dotenv.config()

const currency = 'inr'

const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})


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
        console.log(error);
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
            amount: amount * 100,
            currency: currency.toUpperCase(),
            receipt: newOrder._id.toString()
        };

        razorpayInstance.orders.create(options, (error, order) => {
            if (error) {
                console.log(error);
                return res.status(500).json(error);
            }
            res.status(200).json(order);
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};



// ========================= VERIFY RAZORPAY PAYMENT =========================
export const verifyRazorpay = async (req, res) => {
    try {
        const userId = req.userId;
        const { razorpay_order_id } = req.body;

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

        if (orderInfo.status === 'paid') {
            await Order.findByIdAndUpdate(orderInfo.receipt, { payment: true });
            await User.findByIdAndUpdate(userId, { cartData: {} });

            return res.status(200).json({ message: 'Payment Successful' });
        } else {
            return res.json({ message: 'Payment Failed' });
        }

    } catch (error) {
        console.log(error);
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
        console.log(error);
        return res.status(500).json({ message: "userOrders error" });
    }
};



// ========================= ADMIN: GET ALL ORDERS =========================
export const allOrders = async (req, res) => {
    try {
        const orders = await Order.find({});
        res.status(200).json(orders);
    } catch (error) {
        console.log(error)
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

        // Prevent cancelling delivered orders
        if (order.status === "Delivered") {
            return res.status(400).json("Delivered orders cannot be cancelled");
        }

        // Prevent cancelling orders already being shipped
        if (["Shipped", "Out for Delivery"].includes(order.status)) {
            return res.status(400).json("Order already being shipped");
        }

        // Razorpay → Refund Processing
        if (order.paymentMethod === "Razorpay") {
            order.status = "Refund Processing";
        } else {
            order.status = "Cancelled";   // COD
        }

        await order.save();
        return res.status(200).json("Order cancelled successfully");

    } catch (error) {
        console.log(error);
        res.status(500).json("Internal server error");
    }
};
