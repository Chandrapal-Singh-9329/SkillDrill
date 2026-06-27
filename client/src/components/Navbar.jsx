import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "motion/react";
import { BsRobot, BsCoin } from "react-icons/bs";
import { HiOutlineLogout, HiOutlineTrash } from "react-icons/hi"; // Imported Trash icon
import { FaUserAstronaut } from "react-icons/fa";
import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { setUserData } from "../redux/userSlice";
import AuthModel from "./AuthModel.jsx";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { BsMoonStarsFill, BsSunFill, BsX } from "react-icons/bs"; // Imported Cross icon for modal
const ServerUrl = import.meta.env.VITE_SERVER_URL;

const Navbar = () => {
  const { userData } = useSelector((state) => state.user);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showCreditPopup, setShowCreditPopup] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { theme, setTheme } = useContext(ThemeContext);

  // NEW: States for Delete Account functionality
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const creditPopupRef = useRef(null);
  const userPopupRef = useRef(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        creditPopupRef.current &&
        !creditPopupRef.current.contains(event.target)
      ) {
        setShowCreditPopup(false);
      }

      if (
        userPopupRef.current &&
        !userPopupRef.current.contains(event.target)
      ) {
        setShowUserPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  // NEW: Function to handle Account Deletion
  const handleDeleteAccount = async () => {
    if (!password) {
      alert("Please enter your password to confirm deletion.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you absolutely sure? This action will permanently delete your account and all related data."
    );

    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      
      // Note: In Axios DELETE requests, the body must be passed inside the 'data' property
      const response = await axios.delete(`${ServerUrl}/api/user/delete-account`, {
        data: { password }, 
        withCredentials: true,
      });

      alert(response.data.message);
      
      // Clear user session from frontend and close modals
      dispatch(setUserData(null));
      setShowDeleteModal(false);
      setPassword("");
      setShowUserPopup(false);
      navigate("/");

    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to delete account. Please check your password.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-[#f3f3f3] dark:bg-gray-950 flex justify-center px-4 pt-6 sticky top-0 z-50">
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-6xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-[24px] shadow-sm px-8 py-4 flex justify-between items-center relative"
      >
        <div className="flex items-center gap-3 ">
          <div className="bg-black text-white p-2 rounded-lg">
            <BsRobot size={18} />
          </div>

          <h1 className="font-semibold hidden md:block text-lg text-black dark:text-white">
            SkillDrill
          </h1>
        </div>

        <div className="flex items-center gap-6 relative">
          <button
            title="Toggle Theme"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white px-3 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {theme === "light" ? (
              <BsMoonStarsFill size={22} />
            ) : (
              <BsSunFill size={22} />
            )}
          </button>

          <div ref={creditPopupRef} className="relative">
            <button
              title="Available Credits"
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

          <div ref={userPopupRef} className="relative">
            <button
              title="Profile"
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
                    setShowUserPopup(false);
                  }}
                  className="w-full text-left text-lg py-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                >
                  Interview History
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                  }}
                  className="w-full text-left text-lg py-2 flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                >
                  <HiOutlineLogout size={16} />
                  Logout
                </button>

                {/* NEW: Delete Account Button in Dropdown */}
                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <button
                    onClick={() => {
                      setShowDeleteModal(true);
                      setShowUserPopup(false);
                    }}
                    className="w-full text-left text-lg py-2 flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors"
                  >
                    <HiOutlineTrash size={16} />
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Auth Modal */}
      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}

{/* NEW: Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            // Changed size: max-w-xl for width, p-8 for more padding, rounded-3xl
            className="bg-white dark:bg-gray-900 w-full max-w-xl p-8 rounded-3xl shadow-2xl border border-red-100 dark:border-red-900/30"
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold text-red-600 flex items-center gap-2">
                <HiOutlineTrash size={28} /> Delete Account
              </h2>
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setPassword("");
                }}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
              >
                <BsX size={32} />
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-base leading-relaxed">
              We're sorry to see you go. Please enter your password to confirm that you want to permanently delete your account. This action cannot be undone.
            </p>

            <div className="mb-8">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-lg"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPassword("");
                }}
                className="flex-1 py-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition text-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || !password}
                className="flex-1 py-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition text-lg"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Navbar;