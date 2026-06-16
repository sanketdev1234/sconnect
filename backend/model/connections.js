const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const user=require("./user");

const ConnectionSchema=new Schema({

    sender:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:"user",
    },
    receiver:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:"user",
    },
    status:{
        type:String,
        enum:["pending","accepted","decline"],
        default:"pending"
    }
},{timestamps:true});


ConnectionSchema.index({sender:1,receiver:1},{unique:true})
const connection=mongoose.model("connection",ConnectionSchema);
module.exports=connection;