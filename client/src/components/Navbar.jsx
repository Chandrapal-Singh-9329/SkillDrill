import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "motion/react";
import { BsRobot, BsCoin } from "react-icons/bs";
import { HiOutlineLogout } from "react-icons/hi";
import { FaUserAstronaut } from "react-icons/fa";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { setUserData } from "../redux/userSlice";
import AuthModel from "./AuthModel.jsx";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { BsMoonStarsFill, BsSunFill } from "react-icons/bs";
const ServerUrl = import.meta.env.VITE_SERVER_URL;

const Navbar = () => {
  const { userData } = useSelector((state) => state.user);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showCreditPopup, setShowCreditPopup] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { theme, setTheme } = useContext(ThemeContext);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await axios.get(ServerUrl + "/api/auth/logout", {
        withCredentials: true,
      });
      dispatch(setUserData(null));
      setShowUserPopup(false);
      setShowCreditPopup(false);
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-[#f3f3f3] dark:bg-gray-950 flex justify-center px-4 pt-6 sticky top-0 z-50">
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-6xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-[24px] shadow-sm border border-grey-200 px-8 py-4 flex justify-between items-center relative"
      >
        <div className="flex items-center gap-3 ">
          <div className="bg-black text-white p-2 rounded-lg">
            <BsRobot size={18} />
          </div>

          <h1 className="font-semibold hidden md:block text-lg text-black dark:text-white">SkillDrill</h1>
        </div>

        <div className="flex items-center gap-6 relative">
          <button title="Toggle Theme"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white px-3 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {theme === "light" ? <BsMoonStarsFill size={22}/> : <BsSunFill size={22} />}
          </button>

          <div className="relative">
            <button title="Available Credits"
              onClick={() => {
                if (!userData) {
                  setShowAuth(true);
                  return;
                }
                setShowCreditPopup(!showCreditPopup);
                setShowUserPopup(false);
              }}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white px-4 py-2 rounded-full text-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <BsCoin size={20} />
              {userData?.credits || 0}
            </button>

            {showCreditPopup && (
              <div className="absolute right-[-50px] dark:bg-gray-900 mt-3 w-64 bg-white shadow-xl border dark:border-gray-700 border-gray-200 rounded p-5 z-50">
                <p className="text-lg text-gray-600 dark:text-white mb-4">
                  Need more credits to continue interviews?
                </p>
                <button 
                  onClick={() => {
                    navigate("/pricing");
                  }}
                  className="w-full bg-black text-white py-2 rounded-lg text-lg"
                >
                  Buy more credits
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button title="Profile"
              onClick={() => {
                if (!userData) {
                  setShowAuth(true);
                  return;
                }
                setShowUserPopup(!showUserPopup);
                setShowCreditPopup(false);
              }}
              className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center font-semibold"
            >
              {userData ? (
                userData.name.slice(0, 1).toUpperCase()
              ) : (
                <FaUserAstronaut size={16} />
              )}
            </button>

            {showUserPopup && (
              <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 rounded-xl p-4 z-50">
                <p className="text-lg text-blue-500 font-medium mb-1">
                  {userData?.name}
                </p>
                <button
                  onClick={() => {
                    navigate("/history");
                  }}
                  className="w-full text-left text-lg py-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                >
                  Interview History
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                  }}
                  className="w-full text-left text-lg py-2 flex items-center gap-2 text-red-500"
                >
                  <HiOutlineLogout size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </div>
  );
};

export default Navbar;
