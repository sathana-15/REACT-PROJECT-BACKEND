const jwt=require('jsonwebtoken');
const authMiddleware=(req,res,next)=>{
   /* req.headers={
        "Authorization":"Bearer 123456789"
    }*/
   const token=req.header("Authorization")?.split(" ")[1]; //? null checker
   if(!token){
    return res.status(401).send({message:"Access denied.No token provided"});
   }
   try{
const decoded=jwt.verify(token,"my_secret");
req.user=decoded
next();
   }
   catch(error){
return res.status(400).send({message:"Invalid token"});
   }
} 
module.exports=authMiddleware;