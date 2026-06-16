const mongoose=require("mongoose");
const user=require("../model/user");
const chat=require("../model/chat");
const meeting=require("../model/meeting");
const ExpressError=require("../Utilities/ExpressError");

module.exports.create_new_chat=async(req,res)=>{
    try {
    const meetid=req.params.meetid;
    const curr_meet=await meeting.findById(meetid);
    console.log("the current ongoing meet is ",curr_meet);
    const Content=req.body.Content;
    const new_chat=await chat.insertOne({Content:Content});
    new_chat.Author=req.user._id; // update according to multiple user
    new_chat.Meet=meetid;
    await new_chat.save();
    curr_meet.Chats.push(new_chat);
    await curr_meet.save();
    res.send(new_chat);
    }
    catch(err){
    console.log(err);
    res.send(err);
    }
};
module.exports.all_chat_see=async(req,res)=>{
    try {
        const meetid=req.params.meetid;
        const curr_meet=await meeting.findById(meetid);
        console.log("the current ongoing meet is ",curr_meet);
        const new_chat=await chat.find({Meet:meetid});
        res.send(`the chats of these meetings are: ${new_chat}`)
        }
        catch(err){
        console.log(err);
        res.send(err);
        }
};

module.exports.edit_chat=async(req,res)=>{
    try{
    const Content=req.body.Content;
    const chatid=req.params.chatid;
    const meetid=req.params.meetid;
    const updated_meet=await meeting.findByIdAndUpdate(meetid,{$pull:{Chats:chatid}});
    const updated_chat=await chat.findByIdAndUpdate(chatid,{Content:Content},{new:true});
    updated_meet.Chats.push(updated_chat);
    await updated_meet.save();
    console.log("updated chat is",updated_chat);
    res.send(updated_chat)

    }
    catch(err){
        console.log(err);
        res.send(err);
    }

res.send("edit chat");
}
module.exports.delete_chat=async(req,res)=>{
    try{
const chatid=req.params.chatid;
const meetid=req.params.meetid;
const updated_meet=await meeting.findByIdAndUpdate(meetid,{$pull:{Chats:chatid}});
console.log("updated meeting is ",updated_meet);
const deleted_chat=await chat.findByIdAndDelete(chatid);
console.log("deleted chat is ",deleted_chat);
res.send("chat deleted successfully");
}
catch(err){
    console.log(err);
    res.send(err);
}
}