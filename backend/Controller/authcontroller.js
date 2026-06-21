require("dotenv").config({path:require("path").resolve(__dirname,"../.env")});
const user=require("../model/user");
const jwt=require("jsonwebtoken");
const bcrypt=require("bcrypt");
const createtoken=require("../Utilities/secreattoken");


module.exports.signup=async(req,res,next)=>{
    try{

    const email=req.body.email;
    const display_name=req.body.display_name;
    const password=req.body.password;
    const full_name=req.body.full_name;
    const date_of_birth=req.body.date_of_birth;
    const gender=req.body.gender;

    const isexist=await user.findOne({email:email});
    if(isexist){
        res.send("user already exists please login");
    }
    else {
        const newuser=  new user({email:email , display_name:display_name,password:password,full_name:full_name,gender:gender,date_of_birth:date_of_birth});

        if(req.file){
          console.log("the req.file is",req.file);
          console.log("the image url:",req.file.secure_url);
          console.log("the image filename:",req.file.originalname);
          const photopath=req.file.secure_url;
          newuser.profile_picture.url=photopath;
          newuser.profile_picture.file_id=req.file.originalname;
        }
        
        await newuser.save();
        console.log(newuser);
        const token=createtoken(newuser._id);
        console.log("the token is",token);
res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 24 * 60 * 60 * 1000,
});
res.status(201).send("new user added");
    }
    }
    catch(err){
    console.log(err);
    res.send(err);
    }
}

module.exports.login=async(req,res,next)=>{
    try{
    const {email,password}=req.body;
    if(!email || !password){
        // return res.send("both the filed are required");
        return res.status(201).json({
          message:"both the filed are required"
        });
    }
    const isexisuser=await user.findOne({email:email});
    console.log(isexisuser);
    if(!isexisuser){
    // return res.send("user not register");
        return res.status(201).json({
          message:"user not register"
        });
    }
    const correctpassword=isexisuser.password;
    const authuser=await bcrypt.compare(password, correctpassword)
    console.log("authuser is",authuser)
    if(!authuser){
        // return res.send("incorrect email or password")
        return res.status(201).json({
          message:"incorrect email or password"
        });
    }
    const token=createtoken(isexisuser._id);
res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite:"none",
  maxAge: 24 * 60 * 60 * 1000,
});
    // res.send("login successfull");
        return res.status(200).json({
          message:"login successfull"
        });
    
}
    catch(err){
        res.send(err);
    }
} 

module.exports.logout=(req,res)=>{
res.cookie("token", "", {
  httpOnly: true,
  secure: true,
  sameSite:"none",
  maxAge:0,
});
    res.send("logout done");

}
module.exports.userstatus = (req, res) => {
    const token = req.cookies.token
    if (!token) {
      return res.send("token not found ")
    }
    jwt.verify(token, process.env.JWT_SECRET, async (err, data) => {
      if (err) {
        res.send("token not match")
      } else {
        const User = await user.findById(data.id)
        if (User) {
        console.log(User);
        // res.send(User);

        res.status(200).json({
          message:"user logged in!",
          user:User,
          status:true
        });

        } 
        else  res.send("user not found")
      }
    })
  }