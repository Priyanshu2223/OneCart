import React, { useContext, useState } from 'react';
import logo from '../assets/logo.png';
import { IoSearchCircleOutline, IoSearchCircleSharp } from "react-icons/io5";
import { FaCircleUser } from "react-icons/fa6";
import { MdOutlineShoppingCart } from "react-icons/md";
import { userDataContext } from '../context/UserContext';
import { authDataContext } from '../context/authContext';
import { shopDataContext } from '../context/ShopContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Nav() {
  const { userData, setUserData } = useContext(userDataContext);
  const { serverUrl } = useContext(authDataContext);
  const { showSearch, setShowSearch, search, setSearch, getCartCount } =
    useContext(shopDataContext);

  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.get(serverUrl + "/api/auth/logout", { withCredentials: true });
      setUserData(null);
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="w-[100vw] h-[70px] bg-[#ecfafa] flex items-center justify-between px-[45px] fixed top-0 shadow-md z-50">

      {/* LOGO */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
        <img src={logo} className="w-[32px]" alt="" />
        <h1 className="text-[23px] font-semibold text-black">OneCart</h1>
      </div>

      {/* NAV OPTIONS */}
      <div className="hidden md:flex items-center gap-6">
        <p className="font-semibold px-4 py-2 rounded-xl bg-[#141414] text-white cursor-pointer 
               hover:bg-[#00bcd4] hover:text-black transition"
          onClick={() => navigate("/")}>
          HOME
        </p>

        <p className="font-semibold px-4 py-2 rounded-xl bg-[#141414] text-white cursor-pointer 
               hover:bg-[#00bcd4] hover:text-black transition"
          onClick={() => navigate("/collection")}>
          COLLECTIONS
        </p>

        <p className="font-semibold px-4 py-2 rounded-xl bg-[#141414] text-white cursor-pointer 
               hover:bg-[#00bcd4] hover:text-black transition"
          onClick={() => navigate("/order")}>
          ORDERS
        </p>

        <p className="font-semibold px-4 py-2 rounded-xl bg-[#141414] text-white cursor-pointer 
               hover:bg-[#00bcd4] hover:text-black transition"
          onClick={() => navigate("/about")}>
          ABOUT
        </p>

        <p className="font-semibold px-4 py-2 rounded-xl bg-[#141414] text-white cursor-pointer 
               hover:bg-[#00bcd4] hover:text-black transition"
          onClick={() => navigate("/contact")}>
          CONTACT
        </p>
      </div>

      {/* RIGHT ICONS */}
      <div className="flex items-center gap-6 pr-[20px]">

        {/* SEARCH ICON */}
        {!showSearch ? (
          <IoSearchCircleOutline
            className="w-[32px] h-[32px] text-black cursor-pointer hover:scale-110 transition"
            onClick={() => { setShowSearch(true); navigate("/collection"); }}
          />
        ) : (
          <IoSearchCircleSharp
            className="w-[32px] h-[32px] text-black cursor-pointer hover:scale-110 transition"
            onClick={() => setShowSearch(false)}
          />
        )}

        {/* PROFILE */}
        {!userData ? (
          <FaCircleUser
            className="w-[30px] h-[30px] text-black cursor-pointer hover:scale-110 transition"
            onClick={() => navigate("/login")}
          />
        ) : (
          <div
            className="w-[32px] h-[32px] bg-black text-white rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition"
            onClick={() => setShowProfile(prev => !prev)}
          >
            {userData?.name?.slice(0, 1)}
          </div>
        )}

        {/* CART */}
        <div className="relative cursor-pointer" onClick={() => navigate("/cart")}>
          <MdOutlineShoppingCart className="w-[32px] h-[32px] text-black hover:scale-110 transition" />
          <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-[18px] h-[18px] rounded-full flex items-center justify-center">
            {getCartCount()}
          </span>
        </div>
      </div>

      {/* SEARCH BAR */}
      {showSearch && (
        <div className="absolute top-[70px] left-0 w-full h-[80px] bg-[#d8f6f9] flex items-center justify-center shadow-md">
          <input
            type="text"
            className="w-[80%] md:w-[50%] h-[55px] bg-[#1c2b2e] text-white rounded-3xl px-6 outline-none"
            placeholder="Search here..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* PROFILE DROPDOWN */}
      {showProfile && (
        <div className="absolute top-[80px] right-[40px] w-[180px] bg-[#111] text-white rounded-lg shadow-xl p-3">
          <p className="py-2 px-3 rounded hover:bg-[#222] cursor-pointer" onClick={handleLogout}>
            Logout
          </p>
          <p className="py-2 px-3 rounded hover:bg-[#222] cursor-pointer" onClick={() => navigate("/about")}>
            About
          </p>
        </div>
      )}
    </div>
  );
}

export default Nav;
