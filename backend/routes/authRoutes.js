const router=require("express").Router();

const signup=require("../Controller/authcontroller").signup;
const login=require("../Controller/authcontroller").login;
const userstatus=require("../Controller/authcontroller").userstatus;
const logout=require("../Controller/authcontroller").logout;

const multer=require("multer");
const {storage}=require("../config/cloudinary_config");
const upload=multer({storage});

router.post("/signup",upload.single("profile_picture"),signup);
router.post("/login",login);
router.get("/authstatus",userstatus);
router.get("/logout",logout);

module.exports=router;