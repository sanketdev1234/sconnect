const mongoose=require("mongoose");
const user=require("../model/user");
const chat=require("../model/chat");
const meeting=require("../model/meeting");
const ExpressError=require("../Utilities/ExpressError");

module.exports.create_new_chat = async (req, res) => {
    try {
        const meetid = req.params.meetid;
        const curr_meet = await meeting.findById(meetid);

        if (!curr_meet) {
            return res.status(404).send("Meeting not found");
        }

        const Content = req.body.Content;
        if (!Content || !Content.trim()) {
            return res.status(400).send("Message content is required");
        }

        // ✅ Use `new chat(...)` + `.save()` instead of insertOne — this is the correct Mongoose pattern
        const new_chat = new chat({
            Content: Content,
            Author: req.user._id,
            Meet: meetid,
        });
        await new_chat.save();

        curr_meet.Chats.push(new_chat._id);
        await curr_meet.save();

        // Populate Author before sending back so frontend has display_name immediately
        await new_chat.populate("Author", "display_name email profile_picture");

        res.status(201).send(new_chat);

    } catch (err) {
        console.log(err);
        res.status(500).send("Failed to save message");
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




// module.exports.edit_chat = async (req, res, next) => {
//     try {
//         const { Content } = req.body;
//         const { chatid } = req.params;

//         if (!Content || !Content.trim()) {
//             return res.status(400).send("Content cannot be empty");
//         }

//         // 🟢 Just update the chat content. The ID stays the same, so the meeting stays perfectly linked!
//         const updated_chat = await chat.findByIdAndUpdate(
//             chatid,
//             { $set: { Content: Content } }, // Explicit $set is an excellent, safe practice
//             { new: true }
//         ).populate("Author", "display_name profile_picture"); // Populate so frontend can refresh instantly

//         if (!updated_chat) {
//             return res.status(404).send("Chat message not found");
//         }

//         console.log("updated chat is", updated_chat);
//         res.status(200).json(updated_chat);

//     } catch (err) {
//         console.log(err);
//         res.status(500).send("Error updating chat");
//     }
// };