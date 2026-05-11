import jwt from 'jsonwebtoken';

const isAuth = async (req,res,next) => {
    try {
        const {token} = req.cookies;
        if(!token){
            return res.status(400).json({message:"user does not have a token"});
        }

        const verifyToken = jwt.verify(token, process.env.JWT_SECRETKEY);
        if(!verifyToken)
        {
            return res.status(400).json({message:"User does not have valid token"});
        }

        req.userId = verifyToken.userId;

        next();
        
    } catch (error) {
        res.status(500).json({message:`Google Auth error ${error}`});
    }   
}

export default isAuth;