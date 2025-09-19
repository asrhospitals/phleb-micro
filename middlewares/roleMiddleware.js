const authorizeRole=(...allowedRoles)=>{
    return (req,res,next)=>{
        if(!allowedRoles.includes(req.user.roleType)){
            return res.status(403).json({message:"Access Denied: You don't have the required role to access this resource"});
        }
        next();

    }

}


module.exports=authorizeRole;