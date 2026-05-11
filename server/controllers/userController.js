import userModel from '../models/userModel.js'; 

export const getCurrentUser = async (req,res) => {
    try {
        const user = await userModel.findById(req.userId);
        if(!user)
        {
            res.status(404).json({message:"User not Found"});
        }
        return res.status(200).json(user);
    } catch (error) {
        res.status(500).json({message:`failed to get currentUser ${error}`});
        
    } 
}
