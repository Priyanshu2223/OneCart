import React, { useContext, useState } from 'react'
import Title from '../component/Title'
import CartTotal from '../component/CartTotal'
import razorpay from '../assets/Razorpay.jpg'
import { shopDataContext } from '../context/ShopContext'
import { authDataContext } from '../context/authContext'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Loading from '../component/Loading'

function PlaceOrder() {
  const [method, setMethod] = useState('cod')
  const navigate = useNavigate()
  const { cartItem, setCartItem, getCartAmount, delivery_fee, products } = useContext(shopDataContext)
  const { serverUrl } = useContext(authDataContext)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
    country: '',
    phone: ''
  })

  const onChangeHandler = (e) => {
    const name = e.target.name
    const value = e.target.value
    setFormData(data => ({ ...data, [name]: value }))
  }

  // dynamically add Razorpay script; resolves when script loaded
  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject(new Error('Window is undefined'))
      if (window.Razorpay) return resolve(true)

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => reject(new Error('Razorpay SDK failed to load'))
      document.body.appendChild(script)
    })
  }

  const initPay = async (order) => {
    try {
      // ensure key exists
      const razorKey = import.meta.env.VITE_RAZORPAY_KEY_ID
      if (!razorKey) {
        toast.error('Payment key not configured. Set VITE_RAZORPAY_KEY_ID in your environment.')
        console.error('Missing VITE_RAZORPAY_KEY_ID')
        return
      }

      // load checkout script
      await loadRazorpayScript()

      const options = {
        key: razorKey,
        amount: order.amount, // razorpay order object amount (in paise)
        currency: order.currency || 'INR',
        name: 'OneCart - Order Payment',
        description: 'Order Payment',
        order_id: order.id || order.id, // server returned order.id
        handler: async (response) => {
          // response contains: razorpay_payment_id, razorpay_order_id, razorpay_signature
          try {
            setLoading(true)
            const { data } = await axios.post(serverUrl + '/api/order/verifyrazorpay', response, { withCredentials: true })
            setLoading(false)
            if (data && (data.message === 'Payment Successful' || data.message?.toLowerCase().includes('success'))) {
              toast.success('Payment successful')
              setCartItem({})
              navigate('/order')
            } else {
              toast.error('Payment verification failed')
              console.warn('verify response', data)
            }
          } catch (err) {
            setLoading(false)
            console.error('verifyrazorpay error', err)
            toast.error('Payment verification error')
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#111827'
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (response) {
        // optional: you can show the user the failure reason
        console.error('payment.failed', response.error)
        toast.error('Payment failed: ' + (response?.error?.description || 'Unknown'))
      })
      rzp.open()
    } catch (err) {
      console.error('initPay error', err)
      toast.error('Unable to start payment. Try again.')
    }
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // build items
      let orderItems = []
      for (const items in cartItem) {
        for (const item in cartItem[items]) {
          if (cartItem[items][item] > 0) {
            const itemInfo = structuredClone(products.find(product => product._id === items))
            if (itemInfo) {
              itemInfo.size = item
              itemInfo.quantity = cartItem[items][item]
              orderItems.push(itemInfo)
            }
          }
        }
      }

      if (orderItems.length === 0) {
        toast.error('Cart is empty')
        setLoading(false)
        return
      }

      const orderData = {
        address: formData,
        items: orderItems,
        amount: getCartAmount() + delivery_fee
      }

      if (method === 'cod') {
        const result = await axios.post(serverUrl + '/api/order/placeorder', orderData, { withCredentials: true })
        setLoading(false)
        if (result?.data) {
          setCartItem({})
          toast.success('Order Placed')
          navigate('/order')
        } else {
          toast.error('Order placement failed')
        }
      } else if (method === 'razorpay') {
        // create razorpay order on server
        const resultRazorpay = await axios.post(serverUrl + '/api/order/razorpay', orderData, { withCredentials: true })
        setLoading(false)
        if (resultRazorpay?.data) {
          // server returns the order object from Razorpay (id, amount, currency...)
          initPay(resultRazorpay.data)
        } else {
          toast.error('Unable to create payment order. Try again.')
        }
      }
    } catch (error) {
      console.error('place order error', error)
      toast.error('Order error')
      setLoading(false)
    }
  }

  return (
    <div className='w-[100vw] min-h-[100vh] bg-gradient-to-l from-[#141414] to-[#0c2025] flex items-center justify-center flex-col md:flex-row gap-[50px]  relative'>
      <div className='lg:w-[50%] w-[100%] h-[100%] flex items-center justify-center  lg:mt-[0px] mt-[90px] '>
        <form action="" onSubmit={onSubmitHandler} className='lg:w-[70%] w-[95%] lg:h-[70%] h-[100%]'>
          <div className='py-[10px]'>
            <Title text1={'DELIVERY'} text2={'INFORMATION'} />
          </div>

          <div className='w-[100%] h-[70px] flex items-center justify-between px-[10px]'>
            <input type="text" name='firstName' placeholder='First name' className='w-[48%] h-[50px] rounded-md bg-slate-700 placeholder:text-[white] text-[18px] px-[20px] shadow-sm shadow-[#343434]' required onChange={onChangeHandler} value={formData.firstName} />
            <input type="text" name='lastName' placeholder='Last name' className='w-[48%] h-[50px] rounded-md shadow-sm shadow-[#343434] bg-slate-700 placeholder:text-[white] text-[18px] px-[20px]' required onChange={onChangeHandler} value={formData.lastName} />
          </div>

          <div className='w-[100%] h-[70px] flex items-center justify-between px-[10px]'>
            <input type="email" name='email' placeholder='Email address' className='w-[100%] h-[50px] rounded-md shadow-sm shadow-[#343434] bg-slate-700 placeholder:text-[white] text-[18px] px-[20px]' required onChange={onChangeHandler} value={formData.email} />
          </div>

          <div className='w-[100%] h-[70px] flex items-center justify-between px-[10px]'>
            <input type="text" name='street' placeholder='Street' className='w-[100%] h-[50px] rounded-md bg-slate-700 shadow-sm shadow-[#343434] placeholder:text-[white] text-[18px] px-[20px]' required onChange={onChangeHandler} value={formData.street} />
          </div>

          <div className='w-[100%] h-[70px] flex items-center justify-between px-[10px]'>
            <input type="text" name='city' placeholder='City' className='w-[48%] h-[50px] rounded-md bg-slate-700 shadow-sm shadow-[#343434] placeholder:text-[white] text-[18px] px-[20px]' required onChange={onChangeHandler} value={formData.city} />
            <input type="text" name='state' placeholder='State' className='w-[48%] h-[50px] rounded-md bg-slate-700 shadow-sm shadow-[#343434] placeholder:text-[white] text-[18px] px-[20px]' required onChange={onChangeHandler} value={formData.state} />
          </div>

          <div className='w-[100%] h-[70px] flex items-center justify-between px-[10px]'>
            <input type="text" name='pinCode' placeholder='Pincode' className='w-[48%] h-[50px] rounded-md bg-slate-700 shadow-sm shadow-[#343434] placeholder:text-[white] text-[18px] px-[20px]' required onChange={onChangeHandler} value={formData.pinCode} />
            <input type="text" name='country' placeholder='Country' className='w-[48%] h-[50px] rounded-md bg-slate-700 shadow-sm shadow-[#343434] placeholder:text-[white] text-[18px] px-[20px]' required onChange={onChangeHandler} value={formData.country} />
          </div>

          <div className='w-[100%] h-[70px] flex items-center justify-between px-[10px]'>
            <input type="text" name='phone' placeholder='Phone' className='w-[100%] h-[50px] rounded-md bg-slate-700 shadow-sm shadow-[#343434] placeholder:text-[white] text-[18px] px-[20px]' required onChange={onChangeHandler} value={formData.phone} />
          </div>

          <div>
            <button type='submit' className='text-[18px] active:bg-slate-500 cursor-pointer bg-[#3bcee848] py-[10px] px-[50px] rounded-2xl text-white flex items-center justify-center gap-[20px] absolute lg:right-[20%] bottom-[10%] right-[35%] border-[1px] border-[#80808049] ml-[30px] mt-[20px]' >
              {loading ? <Loading /> : "PLACE ORDER"}
            </button>
          </div>
        </form>
      </div>

      <div className='lg:w-[50%] w-[100%] min-h-[100%] flex items-center justify-center gap-[30px] '>
        <div className='lg:w-[70%] w-[90%] lg:h-[70%] h-[100%]  flex items-center justify-center gap-[10px] flex-col'>
          <CartTotal />
          <div className='py-[10px]'>
            <Title text1={'PAYMENT'} text2={'METHOD'} />
          </div>

          <div className='w-[100%] h-[30vh] lg:h-[100px] flex items-start mt-[20px] lg:mt-[0px] justify-center gap-[50px]'>
            <button type='button' onClick={() => setMethod('razorpay')} className={`w-[150px] h-[50px] rounded-sm  ${method === 'razorpay' ? 'border-[5px] border-blue-900 rounded-sm' : ''}`} >
              <img src={razorpay} className='w-[100%] h-[100%] object-fill rounded-sm ' alt="" />
            </button>
            <button type='button' onClick={() => setMethod('cod')} className={`w-[200px] h-[50px] bg-gradient-to-t from-[#95b3f8] to-[white] text-[14px] px-[20px] rounded-sm text-[#332f6f] font-bold ${method === 'cod' ? 'border-[5px] border-blue-900 rounded-sm' : ''}`}>
              CASH ON DELIVERY
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaceOrder
