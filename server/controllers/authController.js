import userModel from "../models/userModel.js";
import OtpModel from "../models/otpModel.js";
import genToken from "../config/token.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";


// ==========================================
// 1. Send OTP Logic
// ==========================================

export const sendOtp = async (req, res) => {
  try {
    // 1. Receive the 'isForgotPassword' flag along with other details from the frontend
    const { email, isLogin, password, isForgotPassword } = req.body; 

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const existingUser = await userModel.findOne({ email });

    // ==========================================
    //  If the user is requesting a FORGOT PASSWORD OTP
    // ==========================================
    if (isForgotPassword) {
      if (!existingUser) {
        return res.status(404).json({ message: "User not found. Please register first." });
      }
    } 
    
    // ==========================================
    // If the user is attempting to LOGIN
    // ==========================================
    else if (isLogin) {
      if (!existingUser) {
        return res.status(404).json({ message: "User not found. Please register first." });
      }
      
      // Verify password before sending OTP for login
      const isMatch = await bcrypt.compare(password, existingUser.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password." }); 
      }
    } 
    // ==========================================
    // If the user is attempting to REGISTER
    // ==========================================
    else if (!isLogin && existingUser) {
      return res.status(400).json({ message: "User already exists. Please login." });
    }

    // Generate a 6-digit OTP and save it to the database
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OtpModel.create({ email, otp });

    // Configure the email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "SkillDrill - Your OTP Code",
      text: `Your OTP verification code is: ${otp}. It is valid for 2 minutes.`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "OTP sent successfully!" });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: `Error sending OTP: ${error.message}` });
  }
};

// ==========================================
// 2. Register Logic (With OTP Verification)
// ==========================================
export const register = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    //OTP check
    const otpRecord = await OtpModel.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    //delete OTP after Verification
    await OtpModel.deleteMany({ email });

    const token = await genToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Production me true rakhein
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 3. Login Logic (With OTP Verification)
// ==========================================
export const login = async (req, res) => {
  try {
    const { email, password, otp } = req.body;

  
    const otpRecord = await OtpModel.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid Email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    await OtpModel.deleteMany({ email });

    const token = await genToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 4. Google Auth Logic
// ==========================================
export const googleAuth = async (req, res) => {
  try {
    const { name, email } = req.body;
    let user = await userModel.findOne({ email });

    if (!user) {
      user = await userModel.create({
        name,
        email,
      });
    }

    let token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: `Google Auth error ${error}` });
  }
};

// ==========================================
// 5. Logout Logic
// ==========================================
export const logOut = async (req, res) => {
  try {
    await res.clearCookie("token");
    return res.status(200).json({ message: "logOut successfully" });
  } catch (error) {
    return res.status(500).json({ message: `logOut error ${error.message}` });
  }
};




export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // 1. Verify that the user exists in the database
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 2. Verify OTP (Fetch the latest record sorted by creation time)
    const otpRecord = await OtpModel.findOne({ email }).sort({ createdAt: -1 });
    
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // 3. Securely hash the new password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    // 5. Delete all used OTPs for this email to prevent reuse
    await OtpModel.deleteMany({ email });

    return res.status(200).json({ message: "Password reset successfully! You can now login." });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: `Error resetting password: ${error.message}` });
  }
};
