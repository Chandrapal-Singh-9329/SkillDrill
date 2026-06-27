import userModel from '../models/userModel.js'; 
import bcrypt from 'bcryptjs'; 

export const getCurrentUser = async (req,res) => {
    try {
        const user = await userModel.findById(req.userId);
        if(!user) {
            return res.status(404).json({message:"User not Found"});
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({message:`failed to get currentUser ${error}`});
    } 
}

// === Delete Account ===
export const deleteAccount = async (req, res) => {
    try {
        // 1. We get req.userId from the isAuth middleware automatically
        const userId = req.userId;
        
        // The frontend will only send the password for confirmation
        const { password } = req.body; 

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // 2. Security Check: Verify the password before proceeding
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect password. Account deletion failed." });
        }

        // 3. Delete the user from the database
        await userModel.findByIdAndDelete(userId);

        // clear the auth cookie. (Replace 'token' with your actual cookie name if different)
        res.clearCookie("token"); 

        return res.status(200).json({ message: "Account deleted successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: `Error deleting account: ${error.message}` });
    }
};