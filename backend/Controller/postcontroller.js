const comment = require("../model/comment");
const post=require("../model/post");
const user = require("../model/user");

module.exports.get_single_post=async(req,res)=>{
    const postId=req.params.postId;
    console.log(postId);
    try{

    const required_post=await post.findById(postId).populate({path:"comments",populate:{
    path:"Author"
    }}).populate("owner");

    if (!required_post) return res.status(404).send("Post not found");

    console.log(post);
    // res.send(`the require post is : ${required_post}`); 
    res.send(required_post); 
    }
    catch(error){
        console.log(error);
        return res.send(error);
    }
};

module.exports.get_all_post_user=async(req,res)=>{
const personname=req.params.full_name;

try{
    const require_user=await user.findOne({full_name:personname});

    const all_post=await post.find({owner:require_user._id}).populate("owner").populate({path:"comments",populate:{
        path:"Author"
    }}).sort({createdAt:-1});

    console.log(all_post);
    // res.send(all_post);
    res.status(200).json({
        message:"all post sent",
        posts:all_post,
        status:true
    })
}
    catch(error){
        console.log(error);
        return res.send(error);
    }
};


module.exports.getallpost=async(req,res)=>{
try{
    const all_post=await post.find().populate("owner").populate({path:"comments",populate:{
        path:"Author"
    }}).sort({createdAt:-1});

    console.log(all_post);
    // res.send(all_post);
    res.status(200).json({
        message:"all post sent",
        posts:all_post,
        status:true
    })
}
    catch(error){
        console.log(error);
        return res.send(error);
    }
};


module.exports.likepost=async(req,res)=>{
const postId=req.params.postId;
const personId=req.user._id;
try{
const curr_post=await post.findById(postId);

const is_already_like=curr_post.likeby.includes(personId);

if(!is_already_like){
    curr_post.likeby.push(personId);
    await curr_post.save();
    res.send("liked");
}
else{
const unliked_post=await post.findByIdAndUpdate(postId,{$pull:{likeby:personId}});
res.send("like remove");
}

}
    catch(error){
        console.log(error);
        return res.send(error);
    }
}



module.exports.createnewpost=async(req,res)=>{
const text=req.body.text;
console.log(req.user._id) // From your authMiddleware

let  mediaData = { media_url: null, media_id: null };

        
        if (req.file) {
            mediaData = {
                media_url: req.file.secure_url,
                media_id: req.file.originalname
            };
        }
try{
    const post_created=await post.insertOne({text:text ,  media:mediaData});
    post_created.owner=req.user._id;
    await post_created.save();
    // res.send(`the new post created: ${post_created}`);
    res.status(200).json({
        message:"post created",
        post:post_created,
        secure:true
    })
}
    catch(error){
        console.log("the error is ",error);
        return res.send(error);
    }

};

module.exports.editpost=async(req,res)=>{
const text=req.body.text;
const postId=req.params.postId;
const curr_owner=req.user._id;
console.log(req.user._id) // From your authMiddleware
        try{


            // 1. Find the post first to check the timestamp
        const curr_post = await post.findById(postId);

        if (!curr_post) {
            return res.status(404).json({ message: "Post not found" });
        }

// 3. Time Limit Logic: 30 Minutes
        const currentTime = new Date();
        const postCreationTime = new Date(curr_post.createdAt);
        const diffInMinutes = (currentTime - postCreationTime) / (1000 * 60);

        if (diffInMinutes > 30) {
            return res.status(403).json({ 
                message: "Edit time expired. Posts can only be edited within 30 minutes of creation." 
            });
        }

        const updated_post=await post.findByIdAndUpdate({_id:postId,owner:curr_owner},{$set: {text:text}}, {new:true});
        console.log(updated_post);
        if (req.file) {
        updated_post.media={
                media_url: req.file.secure_url,
                media_id: req.file.originalname
            };
            await updated_post.save();
        }
        // res.send(`post edited:${updated_post}`)
        res.status(200).json({
            message:"post edited",
            editedpost:updated_post,
            status:true
        });

        }
        catch(error){
        console.log(error);
        return res.send(error);
    }
};


module.exports.deletepost=async(req,res)=>{
    try{
    const postId=req.params.postId;
    const deleted_post=await post.findByIdAndDelete(postId);
    console.log("deleted_post => ",deleted_post);
    // res.send(`post deleted ${deleted_post}`);
    res.status(200).json({
        message:"post deleted",
    })
    }
    catch(err){
        console.log(err);
        return res.send(err);
    }
};