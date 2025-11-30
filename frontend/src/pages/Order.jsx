import React, { useContext, useEffect, useState } from 'react'
import Title from '../component/Title'
import { shopDataContext } from '../context/ShopContext'
import { authDataContext } from '../context/authContext'
import axios from 'axios'

function Order() {

  let [orderData, setOrderData] = useState([])
  let [selectedOrder, setSelectedOrder] = useState(null)   // MODAL STATE

  let { currency } = useContext(shopDataContext)
  let { serverUrl } = useContext(authDataContext)

  const loadOrderData = async () => {
    try {
      const result = await axios.post(serverUrl + '/api/order/userorder', {}, { withCredentials: true })
      if (result.data) {
        let allOrdersItem = []
        result.data.map((order) => {
          order.items.map((item) => {
            item['status'] = order.status
            item['payment'] = order.payment
            item['paymentMethod'] = order.paymentMethod
            item['date'] = order.date
            item['orderId'] = order._id
            allOrdersItem.push(item)
          })
        })
        setOrderData(allOrdersItem.reverse())
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    loadOrderData()
  }, [])

  // ================= CANCEL ORDER FUNCTION =================
  const cancelOrder = async (orderId) => {
    try {
      const res = await axios.post(
        serverUrl + "/api/order/cancel",
        { orderId },
        { withCredentials: true }
      );

      alert("Order Cancelled Successfully");

      setSelectedOrder(null); // close modal
      loadOrderData(); // refresh data
    } catch (err) {
      alert(err.response?.data || "Unable to cancel order");
    }
  };


  return (
    <div className='w-[99vw] min-h-[100vh] p-[20px] pb-[150px] overflow-hidden bg-gradient-to-l from-[#141414] to-[#0c2025]'>

      {/* TITLE */}
      <div className='h-[8%] w-[100%] text-center mt-[80px]'>
        <Title text1={'MY'} text2={'ORDER'} />
      </div>

      {/* ORDER LIST */}
      <div className='w-[100%] h-[92%] flex flex-wrap gap-[20px]'>

        {orderData.map((item, index) => (
          <div key={index} className='w-[100%] h-[10%] border-t border-b'>

            <div className='w-[100%] h-[80%] flex items-start gap-6 bg-[#51808048] py-[10px] px-[20px] rounded-2xl relative'>

              {/* PRODUCT IMAGE */}
              <img src={item.image1} alt="" className='w-[130px] h-[130px] rounded-md' />

              {/* PRODUCT DETAILS */}
              <div className='flex items-start justify-center flex-col gap-[5px]'>

                <p className='md:text-[25px] text-[20px] text-[#f3f9fc]'>{item.name}</p>

                <div className='flex items-center gap-[8px] md:gap-[20px]'>
                  <p className='md:text-[18px] text-[12px] text-[#aaf4e7]'>{currency} {item.price}</p>
                  <p className='md:text-[18px] text-[12px] text-[#aaf4e7]'>Quantity: {item.quantity}</p>
                  <p className='md:text-[18px] text-[12px] text-[#aaf4e7]'>Size: {item.size}</p>
                </div>

                <p className='md:text-[18px] text-[12px] text-[#aaf4e7]'>
                  Date: 
                  <span className='text-[#e4fbff] pl-[10px] md:text-[16px] text-[11px]'>
                    {new Date(item.date).toDateString()}
                  </span>
                </p>

                <p className='md:text-[16px] text-[12px] text-[#aaf4e7]'>
                  Payment Method: {item.paymentMethod}
                </p>

              </div>

              {/* ORDER STATUS */}
              <div className='absolute md:left-[55%] md:top-[40%] right-[2%] top-[2%]'>
                <div className='flex items-center gap-[5px]'>

                  <p className={`min-w-2 h-2 rounded-full ${
                      item.status === "Cancelled" ? "bg-red-500" : "bg-green-500"
                    }`}>
                  </p>

                  <p className='md:text-[17px] text-[10px] text-[#f3f9fc]'>
                    {item.status}
                  </p>

                </div>
              </div>

              {/* TRACK ORDER BUTTON */}
              <div className='absolute md:right-[5%] right-[1%] md:top-[40%] top-[70%]'>
                <button
                  className='md:px-[15px] px-[5px] py-[3px] md:py-[7px] rounded-md bg-[#101919] 
                             text-[#f3f9fc] text-[12px] md:text-[16px] cursor-pointer active:bg-slate-500'
                  onClick={() => setSelectedOrder(item)}
                >
                  Track Order
                </button>
              </div>

            </div>

          </div>
        ))}
      </div>


      {/* ===================== TRACK ORDER MODAL ===================== */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

          <div className="w-[90%] max-w-[450px] bg-[#122224] text-white rounded-xl shadow-lg p-6 relative">

            {/* CLOSE BUTTON */}
            <button
              className="absolute top-3 right-3 text-white text-xl hover:text-gray-300"
              onClick={() => setSelectedOrder(null)}
            >
              ✖
            </button>

            <h2 className="text-2xl font-semibold mb-4 text-center">Order Tracking</h2>

            {/* ORDER DETAILS */}
            <div className="space-y-3 text-[16px]">

              <p><span className="font-semibold">Product:</span> {selectedOrder.name}</p>

              <p>
                <span className="font-semibold">Status:</span>
                <span className="text-green-400"> {selectedOrder.status}</span>
              </p>

              <p>
                <span className="font-semibold">Order Date:</span> {new Date(selectedOrder.date).toDateString()}
              </p>

              <p>
                <span className="font-semibold">Tracking ID:</span> #{selectedOrder.orderId?.slice(-8)}
              </p>

              <p>
                <span className="font-semibold">Expected Delivery:</span>
                {selectedOrder.status === "Delivered" ? "Delivered" : "3–5 Days"}
              </p>

            </div>

            <hr className='my-4 border-gray-600' />

            {/* TIMELINE */}
            <div className="space-y-3">

              {["Order Placed", "Shipped", "Out for Delivery", "Delivered"].map((step, index) => (
                <div key={index} className="flex items-center gap-2">

                  <div
                    className={`w-3 h-3 rounded-full ${
                      selectedOrder.status === step ||
                      (step === "Order Placed") ||
                      (selectedOrder.status !== "Order Placed" && step === "Shipped")
                        ? "bg-green-400"
                        : "bg-gray-500"
                    }`}
                  ></div>

                  <p>{step}</p>

                </div>
              ))}

            </div>

            {/* ===================== CANCEL ORDER BUTTON ===================== */}
            <div className="mt-6 text-center">

              <button
                disabled={
                  ["Shipped", "Out for Delivery", "Delivered", "Cancelled"]
                    .includes(selectedOrder.status)
                }
                onClick={() => cancelOrder(selectedOrder.orderId)}
                className={`
                  px-5 py-2 rounded-md text-white font-medium 
                  ${["Shipped", "Out for Delivery", "Delivered", "Cancelled"].includes(selectedOrder.status)
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 cursor-pointer"
                  }
                `}
              >
                Cancel Order
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default Order
