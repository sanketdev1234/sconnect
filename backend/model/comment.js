const mongoose=require("mongoose");
const user=require("./user");
const post=require("./post");
const Schema= mongoose.Schema;
    
const CommentSchema=new Schema({
    Author:{
        type:Schema.Types.ObjectId,
        ref:"user"
    },
    post:{
        type:Schema.Types.ObjectId,
        ref:"post"
    },
    text:{
        type:String,
        required:true
    },
},{timestamps:true});

const comment=mongoose.model("comment",CommentSchema);
module.exports=comment;
