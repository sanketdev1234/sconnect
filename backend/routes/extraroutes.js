const router=require("express").Router({mergeParams:true});
const extracontroller=require("../Controller/extracontroller");

router.get("/search",extracontroller.search_by_profile);
router.get("/suggestions",extracontroller.suggestions);
router.get("/personalizedfeed",extracontroller.get_personalized_feed);
router.post("/embed-all",extracontroller.embedAllProfiles); // One-time: generate embeddings for existing profiles

module.exports=router;