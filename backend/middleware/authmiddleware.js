if (process.env.NODE_ENV !== "production") {
require("dotenv").config({path:require("path").resolve(__dirname,"../.env")});
}
const user=require("../model/user");
const jwt=require("jsonwebtoken");
const mongoose=require("mongoose");
const meeting=require("../model/meeting");
const chat=require("../model/chat");
const profile=require("../model/profile");
const post=require("../model/post")
const comment=require("../model/comment")

module.exports.userverification=async(req,res,next)=>{
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).send( "Please register or login first.");
    }
    
    try{
    const decoded=jwt.verify(token,process.env.JWT_SECRET);
    const existing_user=await user.findById(decoded.id);
    if(!existing_user){
        return res.status(404).send( "User not found" );
    }
    else {
        req.user=existing_user;
        next();
    }
    }
    catch(err){
    return res.send(err);
    }
}

module.exports.iscorrect_owner=async(req,res,next)=>{
    const id=req.params.meetid;
    const existingowner_id=req.user._id;
    console.log(existingowner_id);
    try{
    const meet=await meeting.findById(id).populate("Hosted_by");
    const meet_owner_id=meet.Hosted_by._id;
    console.log(meet_owner_id);
    if(existingowner_id.toString() === meet_owner_id.toString()){
        console.log("existing user is owner");
        next();
    }
    else {
        return res.status(403).send("unauthorized");
    }
    }
    catch(err){
        console.log(err);
        return res.send(err);
    }
    
}

module.exports.isPossible=async(req,res,next)=>{
try{
const meetid=req.params.meetid;
const chatid=req.params.chatid;

const curr_meet=await meeting.findById(meetid);

if(curr_meet.isEnded){
    return res.send("chat modification only possible during meeting time!");
}

const curr_chat=await chat.findById(chatid);
console.log("current chat to be processing is ",curr_chat);
const chatAuthor=curr_chat.Author;
console.log(chatAuthor);
console.log(req.user._id);
if(chatAuthor.toString()!=req.user._id.toString()){
return res.send("chat moification can only only be done by Author of chat ")
}
next();
}
catch(err){
console.log(err);
return res.send(err);
}
}

module.exports.iscorrect_owner_profile=async(req,res,next)=>{
    const profileid=req.params.profileId;
    const current_user_id=req.user._id;
    console.log(current_user_id);
    try{
    const user_profile=await profile.findById(profileid); // wwe already store the user id in owner field of profile schema
    const correct_owner_profile=user_profile.owner;
    console.log(correct_owner_profile);

    if(current_user_id.toString()===correct_owner_profile.toString()){
        console.log("correct owner authorise!");
        next();
    }
    else{
    return res.status(403).send("unauthorised user");
    }

    }
    catch(err){
        console.log("error:",err);
        return res.send(err);
    }
}



module.exports.iscorrect_owner_post=async(req,res,next)=>{
    const postid=req.params.postId;
    const current_user_id=req.user._id;
    console.log(current_user_id);
    try{
    const user_post=await post.findById(postid); // wwe already store the user id in owner field of profile schema
    const correct_owner_post=user_post.owner;
    console.log(correct_owner_post);

    if(current_user_id.toString()===correct_owner_post.toString()){
        console.log("correct owner authorise!");
        next();
    }
    else{
    return res.status(403).send("unauthorised user");
    }

    }
    catch(err){
        console.log("error:",err);
        return res.send(err);
    }
}




module.exports.iscorrect_owner_comment=async(req,res,next)=>{
    const commentid=req.params.commentId;
    const current_user_id=req.user._id;
    console.log(current_user_id);
    try{
    const user_comment=await comment.findById(commentid); // wwe already store the user id in owner field of profile schema
    const correct_owner_comment=user_comment.Author;
    console.log(correct_owner_comment);

    if(current_user_id.toString()===correct_owner_comment.toString()){
        console.log("correct owner authorise!");
        next();
    }
    else{
    return res.status(403).send("unauthorised user");
    }

    }
    catch(err){
        console.log("error:",err);
        return res.send(err);
    }
}

// New, separate middleware — only checks if meeting has ended, no chatid required
module.exports.isMeetingActive = async (req, res, next) => {
  try {
    const meetid = req.params.meetid;
    const curr_meet = await meeting.findById(meetid);

    if (!curr_meet) {
      return res.status(404).send("Meeting not found");
    }

    if (curr_meet.isEnded) {
      return res.status(400).send("This meeting has ended. You can no longer send messages.");
    }

    next();
  } catch (err) {
    console.log(err);
    return res.status(500).send("Server error");
  }
};

// handle the error in catch block use return next(err) later recheck for betterment;