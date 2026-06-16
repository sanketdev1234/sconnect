const mongoose=require("mongoose");
const user=require("./user");
const chat=require("./chat");
const Schema=mongoose.Schema;

const meetingSchema=new Schema({
    Hosted_by:{
    type:Schema.Types.ObjectId,
    ref:"user",
    },
    Joining_id:{
        type:String,
        required:[true,"cannot joined using meeting joining id"]
    },
    StartAt:{
        type:Date,
        required:[true,"Start time  required"],
    },
    EndAt:{
        type:Date,
    },
    Participants:[
    { type:Schema.Types.ObjectId,
        ref:"user"
    }
    ],
    Chats:[
        {
            type:Schema.Types.ObjectId,
            ref:"chat"
        }
    ],
    isEnded:{
        type:Boolean,
        default:false
    }

});

meetingSchema.post("findOneAndDelete",async(deleted_meet)=>{
console.log("this is post deletion for meeting schema");
console.log("deleted meet is ",deleted_meet);
if(deleted_meet.Chats.length > 0){
    const deleted_chat = await chat.deleteMany({_id:{$in:deleted_meet}});
    console.log("deleted chats are ",deleted_chat);
}
})
const meeting=mongoose.model("meeting",meetingSchema);
module.exports=meeting;