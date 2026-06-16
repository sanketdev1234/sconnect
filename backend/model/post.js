const mongoose=require("mongoose");
const user=require("./user");
const comment=require("./comment");
const Schema= mongoose.Schema;

const PostSchema=new Schema({
    owner:{
        type:Schema.Types.ObjectId,
        ref:"user"
    },
    comments:
        [{
        type:Schema.Types.ObjectId,
        ref:"comment"
    }
],

    likeby:[
{
    type:Schema.Types.ObjectId,
    ref:"user"
}
    ],
    // Main text content of the post
    text: {
        type: String,
        required: true,
    },


    media:{
        // Optional: URL to an image or video associated with the post (e.g., from Cloudinary)
        media_url: {
            type: String,
            default:null
        },
        media_id:{
            type:String,
            default:null,
        },
    },
},{timestamps:true});

const post=mongoose.model("post",PostSchema);
module.exports=post;