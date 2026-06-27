import express from 'express';
import {googleAuth , logOut, register,
  login,sendOtp} from '../controllers/authController.js';

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post('/google',googleAuth);
authRouter.get('/logout', logOut);
authRouter.post("/send-otp", sendOtp);

export default authRouter;
