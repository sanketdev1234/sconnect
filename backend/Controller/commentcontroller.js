const post=require("../model/post");
const user = require("../model/user");
const comment=require("../model/comment");

module.exports.all_comment_see=async(req,res)=>{
    try {
        const postid=req.params.postId;
        const curr_post=await post.findById(postid);
        console.log("the current ongoing post is ",curr_post);
        const all_comment=await comment.find({post:postid}).populate("Author");
        // res.send(`the comments of these posts are: ${all_comment}`)
        res.status(200).json({
            comments:all_comment
        });

        }
        catch(err){
        console.log(err);
        return  res.send(err);
        }
};


module.exports.create_new_comment=async(req,res)=>{
    try {

    const postid=req.params.postId;
    const curr_post=await post.findById(postid);
    console.log("the current ongoing post is ",curr_post);
    const text=req.body.text;
    const new_comment=await comment.insertOne({text:text});
    new_comment.Author=req.user._id; // update according to multiple user
    new_comment.post=postid;
    await new_comment.save();
    
    const fullcomment=await new_comment.populate("Author")

    console.log("new comment",fullcomment);

    curr_post.comments.push(new_comment);
    await curr_post.save();
    // res.send(new_comment);
            res.status(200).json({
            comment:fullcomment,
        });
    }
    catch(err){
    console.log(err);
    return res.send(err);
    }
};




module.exports.edit_comment=async(req,res)=>{
    try{
    const text=req.body.text;
    const commentid=req.params.commentId;
    const postid=req.params.postId;
    const updated_post=await post.findByIdAndUpdate(postid,{$pull:{comments:commentid}});
    const updated_comment=await comment.findByIdAndUpdate(commentid,{text:text},{new:true});
    updated_post.comments.push(updated_comment);
    await updated_post.save();
    console.log("updated comment is",updated_comment);
    res.send(updated_comment)

    }
    catch(err){
        console.log(err);
        return res.send(err);
    }

}


module.exports.delete_comment=async(req,res)=>{
    try{
    const commentid=req.params.commentId;
    const postid=req.params.postId;
    const updated_post=await post.findByIdAndUpdate(postid,{$pull:{comments:commentid}});
    console.log(updated_post);
    const deleted_comment=await comment.findByIdAndDelete(commentid);
    console.log("deleted comment is",deleted_comment);
    res.send("comment delted")

    }
    catch(err){
        console.log(err);
        return res.send(err);
    }

}


