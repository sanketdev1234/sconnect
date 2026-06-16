const router=require("express").Router({mergerParams:true});

const profileController=require("../Controller/profilecontroller");
const iscorrect_owner_profile=require("../middleware/authmiddleware").iscorrect_owner_profile

const multer=require("multer");
const {storage}=require("../config/cloudinary_config");
const upload=multer({storage});


router.get("/get/:userId",profileController.getProfile);
router.post("/addnew",profileController.createProfile);
router.put("/edit/:profileId",iscorrect_owner_profile,upload.single("edited-profile-picture"),profileController.updateProfile);
router.delete("/delete/:profileId",iscorrect_owner_profile,profileController.deleteProfile);
router.get("/download-profile/:userId" , profileController.downloadProfilePdf )
module.exports=router;

// in add, edit , delete routes, userId will be of current present logged in user only because only then he will be able to add, edit or delete his profile.
// while in get route, userId can be of any user whose profile we want to see.


