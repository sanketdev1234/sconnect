const router=require("express").Router({mergeParams:true});
const iscorrect_owner_comment=require("../middleware/authmiddleware").iscorrect_owner_comment
const commentcontroller=require("../Controller/commentcontroller");

//see all the comment of the post
router.get("/all",commentcontroller.all_comment_see); 

//create a new comment
router.post("/new",commentcontroller.create_new_comment);

router.patch("/:commentId/edit",iscorrect_owner_comment,commentcontroller.edit_comment);
router.delete("/:commentId/delete",iscorrect_owner_comment,commentcontroller.delete_comment);

module.exports=router