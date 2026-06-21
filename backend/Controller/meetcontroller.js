const ExpressError=require("../Utilities/ExpressError");
const meeting=require("../model/meeting");
const user=require("../model/user")
const chat=require("../model/chat");
const mongoose=require("mongoose");


module.exports.getallmeeting=async(req,res)=>{
    try{
        console.log(req.user._id);
        const curr_user=req.user._id;
        const all_meetings=await meeting.find({
            $or: [
                { Hosted_by: curr_user },
                { Participants: { $in: [curr_user] } }
            ]
        }).populate("Hosted_by");
        console.log(all_meetings);
        res.send(all_meetings);
    }
    catch(err){
    console.log(err);
    res.send(err);
    }
    
};
// Controller/meetcontroller.js
module.exports.joinmeet = async (req, res) => {
    try {
        const joinid = req.params.joinid;
        const curr_meet = await meeting.findOne({ Joining_id: joinid }).populate("Hosted_by");

        // ✅ This check was completely missing — null check before using curr_meet
        if (!curr_meet) {
            return res.status(404).send("Meeting not found");
        }

        // ✅ The isEnded check we discussed earlier — also missing until now
        if (curr_meet.isEnded) {
            return res.status(400).send("This meeting has ended");
        }

        console.log("user id ", req.user._id);
        console.log("curr meet is", curr_meet);
        console.log("Host is", curr_meet.Hosted_by._id);

        if (curr_meet.Hosted_by._id.toString() != req.user._id.toString()) {
            // Avoid duplicate participant entries on repeat joins
            const alreadyJoined = curr_meet.Participants.some(
                p => p.toString() === req.user._id.toString()
            );
            if (!alreadyJoined) {
                curr_meet.Participants.push(req.user._id);
                await curr_meet.save();
            }
        }

        res.status(200).send(curr_meet);

    } catch (err) {
        console.log(err);
        res.status(500).send("Failed to join meeting. Please try again.");
    }
};

module.exports.create_new_meet=async(req,res)=>{
    try{
    console.log(req.user._id);
    const Hosted_by=req.user._id;
    const Joining_id=req.body.Joining_id;
    const StartAt=req.body.StartAt;
    const EndAt=req.body.EndAt;
    const curr_meet=await meeting.insertOne({Joining_id:Joining_id,StartAt:StartAt,EndAt:EndAt});
    console.log(curr_meet);
    // add the host 
    curr_meet.Hosted_by=Hosted_by;
    curr_meet.Participants=Hosted_by;// add remaining participants later
    await curr_meet.save();
    res.send(`added  new meet ${curr_meet}`);
    }
    catch(err){
        console.log(err);
        res.send(err);
    }
    
};
module.exports.getmeetdetail=async(req,res)=>{
    try{
    const meetid=req.params.meetid;
    console.log(req.user._id);
    const curr_user=req.user._id;
    const detail_meet=await meeting.findById(meetid).populate({path:"Chats" , populate:{
        path:"Author",
            },}).populate("Participants").populate("Hosted_by");
    console.log(detail_meet);
    res.send(detail_meet);
    }
    catch(err){
        console.log(err);
        res.send(err);
    }
    
};
module.exports.deletemeet=async(req,res)=>{
    try{
    const meetid=req.params.meetid;
    const deleted_meet=await meeting.findByIdAndDelete(meetid);
    console.log("deleted_meet => ",deleted_meet);
    res.send(`meet deleted ${deleted_meet}`);
    }
    catch(err){
        console.log(err);
        res.send(err);
    }

};

module.exports.endmeetingnow = async (req, res) => {
    try {
        const meetid = req.params.meetid;
        const ended_meet = await meeting.findByIdAndUpdate(
            meetid,
            { $set: { isEnded: true, EndAt: new Date() } },
            { new: true }
        );
        if (!ended_meet) {
            return res.status(404).send("Meeting not found");
        }
        res.status(200).json({
            message: "meeting ended",
            meeting: ended_meet,
            status: true
        });
    } catch (err) {
        console.log(err);
        res.send(err);
    }
};
