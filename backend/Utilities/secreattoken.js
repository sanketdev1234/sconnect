require("dotenv").config({path:require("path").resolve(__dirname,"../.env")});
const jwt=require("jsonwebtoken");

const createtoken=(id)=>{
    return jwt.sign({
        exp: Math.floor(Date.now() / 1000) + (60*60*24),id
    },process.env.JWT_SECRET);
}
module.exports=createtoken;