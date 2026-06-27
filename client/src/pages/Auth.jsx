import React, { useState, useEffect } from "react";
import { BsRobot, BsGraphUp, BsLightningCharge, BsArrowLeft, BsEye, BsEyeSlash } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { motion } from "motion/react";
import { FcGoogle } from "react-icons/fc";
import { auth, provider } from "../utils/Firebase.js";
import { signInWithPopup } from "firebase/auth";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice.js";

const Auth = ({ isModel = false }) => {
  const dispatch = useDispatch();
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  
  const [isLogin, setIsLogin] = useState(true);
  const [isOtpSent, setIsOtpSent] = useState(false); 
  // NEW: State to track if user is in forgot password flow
  const [isForgotPassword, setIsForgotPassword] = useState(false); 
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [timer, setTimer] = useState(60); 

  useEffect(() => {
    let interval;
    if (isOtpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOtpSent, timer]);

  // Reset all states when switching modes
  const toggleAuthMode = (mode) => {
    setIsLogin(mode);
    setIsForgotPassword(false);
    setErrors({});
    setApiError("");
    setName("");
    setEmail("");
    setPassword("");
    setOtp("");
    setIsOtpSent(false); 
    setTimer(60); 
    setShowPassword(false);
  };

  // Switch to Forgot Password mode
  const handleForgotPasswordClick = () => {
    setIsForgotPassword(true);
    setErrors({});
    setApiError("");
    setPassword("");
    setOtp("");
    setIsOtpSent(false);
  };

  const validateForm = (checkingOtp = false) => {
    const newErrors = {};
    
    if (checkingOtp) {
      if (!otp.trim()) {
        newErrors.otp = "OTP is required.";
      } else if (otp.length !== 6 || !/^\d+$/.test(otp)) { 
        newErrors.otp = "Please enter a valid 6-digit OTP.";
      }
      
      // If resetting password, validate the new password as well
      if (isForgotPassword) {
        if (!password) {
          newErrors.password = "New password is required.";
        } else if (password.length < 8) {
          newErrors.password = "Password must be at least 8 characters long.";
        } else if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
          newErrors.password = "Must contain at least 1 letter, 1 number, and 1 symbol.";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (!isLogin && !isForgotPassword && !name.trim()) {
      newErrors.name = "Name is required.";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    } else if (!email.toLowerCase().endsWith("@gmail.com")) {
      newErrors.email = "Email must end with @gmail.com";
    }

    // Only validate password here if we are NOT in the first step of forgot password
    if (!isForgotPassword) {
      if (!password) {
        newErrors.password = "Password is required.";
      } else if (!isLogin) {
        if (password.length < 8) {
          newErrors.password = "Password must be at least 8 characters long.";
        } else if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
          newErrors.password = "Must contain at least 1 letter, 1 number, and 1 symbol.";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async () => {
    setApiError("");
    if (!validateForm(false)) return;

    try {
      setLoading(true);
      // Pass the isForgotPassword flag to the backend
      await axios.post(
        `${serverUrl}/api/auth/send-otp`,
        { email, isLogin, password, isForgotPassword }, 
        { withCredentials: true }
      );

      setIsOtpSent(true);
      setTimer(60); 
    } catch (error) {
      console.log(error);
      setApiError(error.response?.data?.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setApiError("");
    setErrors({...errors, otp: null}); 
    setOtp(""); 
    
    try {
      setLoading(true);
      await axios.post(
        `${serverUrl}/api/auth/send-otp`,
        { email, isLogin, password, isForgotPassword },
        { withCredentials: true }
      );
      setTimer(60); 
    } catch (error) {
      console.log(error);
      setApiError(error.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSubmit = async () => {
    setApiError("");
    if (!validateForm(true)) return; 

    try {
      setLoading(true);
      
      // NEW: Handle Reset Password API call
      if (isForgotPassword) {
        await axios.post(
          `${serverUrl}/api/auth/reset-password`,
          { email, otp, newPassword: password },
          { withCredentials: true }
        );
        alert("Password reset successfully! You can now login with your new password.");
        toggleAuthMode(true); // Switch back to normal login mode
        return;
      }

      // Normal Login/Register API call
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const result = await axios.post(
        `${serverUrl}${endpoint}`,
        { name, email, password, otp },
        { withCredentials: true }
      );

      dispatch(setUserData(result.data));
    } catch (error) {
      console.log(error);
      setApiError(error.response?.data?.message || "Invalid request or OTP failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setApiError("");
      const response = await signInWithPopup(auth, provider);
      let User = response.user;
      
      const result = await axios.post(
        serverUrl + "/api/auth/google",
        { name: User.displayName, email: User.email },
        { withCredentials: true }
      );
      dispatch(setUserData(result.data));
    } catch (error) {
      console.log(error);
      setApiError("Google Authentication failed. Please try again.");
      dispatch(setUserData(null));
    }
  };

  return (
    <div className={`w-full ${isModel ? "flex justify-center" : "min-h-screen bg-gray-50 flex justify-center items-center px-4 py-12 dark:bg-gray-950"}`}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`w-full ${isModel ? "rounded-[2.5rem] p-8 lg:p-12 min-h-[650px]" : "max-w-[1300px] p-8 lg:p-16 rounded-[3rem] min-h-[750px]"} bg-white shadow-2xl border border-gray-100 dark:bg-gray-900 dark:border-gray-800 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 overflow-hidden items-center`}
      >
        {/* ================= LEFT SECTION ================= */}
        <div className="flex flex-col justify-center items-start lg:pr-6 h-full">
          <div className="flex items-center gap-4 mb-10 lg:mb-14">
            <div className="bg-black dark:bg-white text-white dark:text-black p-3 rounded-2xl shadow-lg">
              <BsRobot size={28} />
            </div>
            <h1 className="font-extrabold text-3xl dark:text-white tracking-wide">
              SkillDrill
            </h1>
          </div>

          <div className="mb-8 w-full">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
              Master Your Next <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-400">
                Tech Interview
              </span>
            </h1>
            <p className="text-gray-500 text-base lg:text-xl font-medium leading-relaxed dark:text-gray-400">
              Sign in to unlock AI-powered mock interviews and get detailed insights to land your dream job.
            </p>
          </div>
        </div>

        {/* ================= RIGHT SECTION ================= */}
        <div className="relative h-full flex flex-col justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-gray-800/10 rounded-[2.5rem] transform scale-[1.03] -z-10"></div>

          <div className="bg-white dark:bg-gray-800/90 p-8 sm:p-10 lg:p-14 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none flex flex-col justify-center h-full backdrop-blur-sm">
            
            {/* Login/Register Toggle (Hidden during Forgot Password) */}
            {!isOtpSent && !isForgotPassword && (
              <div className="flex bg-gray-100 dark:bg-gray-900/80 p-2 rounded-full mb-8 shadow-inner">
                <button
                  onClick={() => toggleAuthMode(true)}
                  className={`flex-1 py-4 rounded-full font-bold text-base transition-all duration-300 ${isLogin ? "bg-green-600 text-white shadow-lg transform scale-100" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => toggleAuthMode(false)}
                  className={`flex-1 py-4 rounded-full font-bold text-base transition-all duration-300 ${!isLogin ? "bg-green-600 text-white shadow-lg transform scale-100" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Register
                </button>
              </div>
            )}

            {apiError && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center justify-center text-center">
                {apiError}
              </motion.div>
            )}

            <div className="space-y-5 lg:space-y-6 mb-10">
              
              {/* === Step 1: Initial Inputs (Before OTP is sent) === */}
              {!isOtpSent ? (
                <>
                  {isForgotPassword && (
                    <div className="mb-2">
                       <button 
                        onClick={() => toggleAuthMode(true)} 
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 mb-6 font-medium transition-colors w-fit"
                      >
                        <BsArrowLeft /> Back to Login
                      </button>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Reset Password</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Enter your registered email address to receive an OTP.</p>
                    </div>
                  )}

                  {!isLogin && !isForgotPassword && (
                    <div className="flex flex-col">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if(errors.name) setErrors({...errors, name: null});
                        }}
                        className={`w-full px-6 py-4 lg:py-5 rounded-2xl border bg-gray-50/50 dark:bg-gray-900 dark:text-white outline-none transition-all placeholder-gray-400 text-lg ${errors.name ? "border-red-500 focus:ring-2 focus:ring-red-500 bg-red-50/30" : "border-gray-200 focus:ring-2 focus:ring-green-500"}`}
                      />
                      {errors.name && <span className="text-red-500 text-xs mt-2 ml-2 font-medium">{errors.name}</span>}
                    </div>
                  )}

                  <div className="flex flex-col">
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if(errors.email) setErrors({...errors, email: null});
                      }}
                      className={`w-full px-6 py-4 lg:py-5 rounded-2xl border bg-gray-50/50 dark:bg-gray-900 dark:text-white outline-none transition-all placeholder-gray-400 text-lg ${errors.email ? "border-red-500 focus:ring-2 focus:ring-red-500 bg-red-50/30" : "border-gray-200 focus:ring-2 focus:ring-green-500"}`}
                    />
                    {errors.email && <span className="text-red-500 text-xs mt-2 ml-2 font-medium">{errors.email}</span>}
                  </div>

                  {!isForgotPassword && (
                    <div className="flex flex-col">
                      <div className="relative w-full">
                        <input
                          type={showPassword ? "text" : "password"} 
                          placeholder="Password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if(errors.password) setErrors({...errors, password: null});
                          }}
                          className={`w-full px-6 py-4 lg:py-5 pr-12 rounded-2xl border bg-gray-50/50 dark:bg-gray-900 dark:text-white outline-none transition-all placeholder-gray-400 text-lg ${errors.password ? "border-red-500 focus:ring-2 focus:ring-red-500 bg-red-50/30" : "border-gray-200 focus:ring-2 focus:ring-green-500"}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showPassword ? <BsEyeSlash size={22} /> : <BsEye size={22} />}
                        </button>
                      </div>
                      {errors.password && <span className="text-red-500 text-xs mt-2 ml-2 font-medium">{errors.password}</span>}
                      
                      {/* NEW: Forgot Password Link (Only shown during Login) */}
                      {isLogin && (
                        <div className="flex justify-end mt-2">
                          <button 
                            type="button" 
                            onClick={handleForgotPasswordClick}
                            className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline transition-colors"
                          >
                            Forgot Password?
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full py-4 lg:py-5 mt-4 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white rounded-2xl font-bold text-lg lg:text-xl transition-all shadow-xl disabled:opacity-70"
                  >
                    {loading ? "Sending..." : isForgotPassword ? "Send Reset OTP" : "Continue"}
                  </button>
                </>
              ) : (
                
                /* === Step 2: OTP Verification Screen === */
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
                  
                  <button 
                    onClick={() => setIsOtpSent(false)} 
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 mb-6 font-medium transition-colors w-fit"
                  >
                    <BsArrowLeft /> Back to edit details
                  </button>

                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Check your Email</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                    We've sent a 6-digit code to <span className="font-semibold text-gray-700 dark:text-gray-300">{email}</span>
                  </p>

                  <div className="space-y-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value);
                          if(errors.otp) setErrors({...errors, otp: null});
                        }}
                        className={`w-full px-6 py-4 lg:py-5 rounded-2xl border text-center tracking-[0.5em] placeholder:tracking-normal placeholder:text-base placeholder:font-medium text-2xl font-bold bg-gray-50/50 dark:bg-gray-900 dark:text-white outline-none transition-all ${errors.otp ? "border-red-500 focus:ring-2 focus:ring-red-500 bg-red-50/30" : "border-gray-200 focus:ring-2 focus:ring-green-500"}`}
                      />
                      {errors.otp && <span className="text-red-500 text-xs mt-2 text-center font-medium block">{errors.otp}</span>}
                    </div>

                    {/* NEW: Show New Password input if in Forgot Password mode */}
                    {isForgotPassword && (
                      <div className="relative w-full mt-2">
                        <input
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter New Password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if(errors.password) setErrors({...errors, password: null});
                          }}
                          className={`w-full px-6 py-4 lg:py-5 pr-12 rounded-2xl border bg-gray-50/50 dark:bg-gray-900 dark:text-white outline-none transition-all placeholder-gray-400 text-lg ${errors.password ? "border-red-500 focus:ring-2 focus:ring-red-500 bg-red-50/30" : "border-gray-200 focus:ring-2 focus:ring-green-500"}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showPassword ? <BsEyeSlash size={22} /> : <BsEye size={22} />}
                        </button>
                        {errors.password && <span className="text-red-500 text-xs mt-2 ml-2 font-medium block">{errors.password}</span>}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleVerifyAndSubmit}
                    disabled={loading}
                    className="w-full py-4 lg:py-5 mt-6 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white rounded-2xl font-bold text-lg lg:text-xl transition-all shadow-xl disabled:opacity-70"
                  >
                    {loading ? "Processing..." : isForgotPassword ? "Reset Password" : isLogin ? "Verify & Login" : "Verify & Create Account"}
                  </button>

                  <div className="mt-6 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    Didn't receive the code?{" "}
                    {timer > 0 ? (
                      <span className="text-gray-400 dark:text-gray-500">
                        Resend in {timer}s
                      </span>
                    ) : (
                      <button
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-green-600 hover:text-green-700 dark:hover:text-green-500 transition-colors hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                </motion.div>
              )}
            </div>

            {/* Google Block (Hide if OTP sent or in Forgot Password mode) */}
            {!isOtpSent && !isForgotPassword && (
              <>
                <div className="flex items-center gap-4 mb-10">
                  <div className="flex-1 h-[1px] bg-gray-200 dark:bg-gray-700"></div>
                  <span className="text-gray-400 font-bold text-sm tracking-widest uppercase">Or</span>
                  <div className="flex-1 h-[1px] bg-gray-200 dark:bg-gray-700"></div>
                </div>

                <motion.button
                  onClick={handleGoogleAuth}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full justify-center items-center flex gap-4 py-4 lg:py-5 bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-800 font-bold text-lg rounded-2xl shadow-sm transition-all"
                >
                  <FcGoogle size={28} />
                  Continue with Google
                </motion.button>
              </>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;