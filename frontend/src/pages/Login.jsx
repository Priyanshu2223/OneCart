import React, { useContext, useState } from 'react';
import Logo from "../assets/logo.png";
import google from "../assets/google.png";
import { IoEyeOutline, IoEye } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../../utils/Firebase';
import { authDataContext } from '../context/authContext';
import { userDataContext } from '../context/UserContext';
import Loading from '../component/Loading';

function Login() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("priya@gmail.com");
  const [password, setPassword] = useState("12345678"); // or empty
  const [loading, setLoading] = useState(false);

  const { serverUrl } = useContext(authDataContext);
  const { getCurrentUser } = useContext(userDataContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await axios.post(
        serverUrl + '/api/auth/login',
        { email, password },
        { withCredentials: true }
      );

      console.log('Login Response:', result.data);

      await getCurrentUser();
      toast.success("Login successful");
      navigate('/');
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || "Login failed");
    }

    setLoading(false);
  };

  const googlelogin = async () => {
    try {
      const response = await signInWithPopup(auth, provider);
      const user = response.user;

      const result = await axios.post(
        serverUrl + '/api/auth/googlelogin',
        { name: user.displayName, email: user.email },
        { withCredentials: true }
      );

      console.log('Google Login:', result.data);

      await getCurrentUser();
      toast.success("Google Login successful");
      navigate('/');
    } catch (err) {
      console.log(err);
      toast.error("Google Login failed");
    }
  };

  return (
    <div className='w-[100vw] h-[100vh] bg-gradient-to-l from-[#141414] to-[#0c2025] text-white flex flex-col items-center justify-start'>
      <div
        className='w-full h-[80px] flex items-center justify-start px-[30px] gap-[10px] cursor-pointer'
        onClick={() => navigate("/")}
      >
        <img className='w-[40px]' src={Logo} alt="" />
        <h1 className='text-[22px] font-sans'>OneCart</h1>
      </div>

      <div className='w-full h-[100px] flex items-center justify-center flex-col gap-[10px]'>
        <span className='text-[25px] font-semibold'>Login Page</span>
        <span className='text-[16px]'>Welcome to OneCart, Place your order</span>
      </div>

      <div className='max-w-[600px] w-[90%] h-[500px] bg-[#00000025] border border-[#96969635] rounded-lg shadow-lg flex items-center justify-center'>
        <form
          onSubmit={handleLogin}
          className='w-[90%] h-[90%] flex flex-col items-center justify-start gap-[20px]'
        >
          <div
            className='w-[90%] h-[50px] bg-[#42656cae] rounded-lg flex items-center justify-center gap-[10px] py-[20px] cursor-pointer'
            onClick={googlelogin}
          >
            <img src={google} alt="" className='w-[20px]' /> Login account with Google
          </div>

          <div className='w-full h-[20px] flex items-center justify-center gap-[10px]'>
            <div className='w-[40%] h-[1px] bg-[#96969635]'></div>
            OR
            <div className='w-[40%] h-[1px] bg-[#96969635]'></div>
          </div>

          <div className='w-[90%] flex flex-col items-center justify-center gap-[15px] relative'>
            <input
              type="email"
              className='w-full h-[50px] border-2 border-[#96969635] rounded-lg bg-transparent placeholder-[#ffffffc7] px-[20px] font-semibold'
              placeholder='Email'
              required
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
            <input
              type={show ? "text" : "password"}
              className='w-full h-[50px] border-2 border-[#96969635] rounded-lg bg-transparent placeholder-[#ffffffc7] px-[20px] font-semibold'
              placeholder='Password'
              required
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />

            {!show && (
              <IoEyeOutline
                className='w-[20px] h-[20px] cursor-pointer absolute right-[5%] bottom-[57%]'
                onClick={() => setShow(true)}
              />
            )}
            {show && (
              <IoEye
                className='w-[20px] h-[20px] cursor-pointer absolute right-[5%] bottom-[57%]'
                onClick={() => setShow(false)}
              />
            )}

            <button className='w-full h-[50px] bg-[#6060f5] rounded-lg flex items-center justify-center mt-[20px] text-[17px] font-semibold'>
              {loading ? <Loading /> : "Login"}
            </button>

            <p className='flex gap-[10px]'>
              You haven't any account?
              <span
                className='text-[#5555f6cf] text-[17px] font-semibold cursor-pointer'
                onClick={() => navigate("/signup")}
              >
                Create New Account
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
