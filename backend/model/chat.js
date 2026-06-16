const mongoose=require("mongoose");
const user=require("./user")
const meeting=require("./meeting");
const Schema=mongoose.Schema;

const chatSchema=new Schema({
    Author:{
        type:Schema.Types.ObjectId,
        ref:"user",

    },
    Content:{
        type:String,
        required:true
    },
    Meet:{
        type:Schema.Types.ObjectId,
        ref:"meeting",

    }
});

const chat =mongoose.model("chat",chatSchema);
module.exports=chat;

