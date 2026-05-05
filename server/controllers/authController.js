import userModel from '../models/userModel.js'
import genToken from "../config/token.js";


export const googleAuth = async (req, res) => {
    try {
        const {name, email} = req.body;
        let user = await userModel.findOne({email});
        if(!user)
        {
            user = await userModel.create({
                name,
                email
            })
        }

        let token = await genToken(user._id);
        res.cookie("token" , token , {
            httpOnly:true,
            secure:false,
            sameSite: "lax",
            maxAge : 7 * 24 * 60 * 60 * 1000
        })

        return res.status(200).json(user);
        
    } catch (error) {
        return res.status(500).json(`google Auth error ${error}`);
    }
}

export const logOut = async (req, res) => {
    try {
        await res.clearCookie("token");
        return res.status(200).json({message:"logOut successfully"});
        
    } catch (error) {
        return res.status(500).json({message:`logOut error ${error.message}`});
        
    }
    
}