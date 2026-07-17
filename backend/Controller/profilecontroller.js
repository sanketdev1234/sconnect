const profile=require("../model/profile");
const user = require("../model/user");
const validators=require("../Utilities/JoiValidators");
const PDFDocument = require('pdfkit');
const { generateEmbedding, buildProfileText } = require("../Utilities/aiEmbeddings");

module.exports.getProfile=async(req,res)=>{
const userid=req.params.userId;
console.log("user:",userid);
try{
const user_profile=await profile.findOne({owner:userid}).populate("owner");
console.log(user_profile);
// res.send(`the selected user profile is ${user_profile}`);
res.status(200).json({
    message:"profile fetch done",
    profile:user_profile,
    status:true
});

}
catch(err){
    console.log("error:",err);
    return res.send(err);
}
}


module.exports.createProfile=async(req,res)=>{
    
    
    const current_user_id=req.user._id;
   const { error, value }=validators.profile_validator.validate(req.body);
    if(error){
        console.log("schema validation of profile fail");
        return res.send(error);
    }
    else {
            console.log('Validated Data:', value);
        }


        const bio= value.bio;
        const headline=value.headline;
        const location=value.location
        const social=value.social
        const Education=value.Education;
        const Experience=value.Experience;

    console.log("bio",bio);
    console.log("location",location);
    console.log("headline",headline);
    console.log(social);
    console.log(Education);
    console.log(Experience);


    try{
    const created_profile_new=await profile.insertOne({bio:bio , headline:headline,location:location , social:social,Education:Education , Experience:Experience});
    created_profile_new.owner=current_user_id;
    await created_profile_new.save();
    // res.send(`new profile added : ${created_profile_new}`);
    res.status(200).json({
        success:true,
        message:"profile created",
        data:created_profile_new
    })

    // Generate AI embedding in background (non-blocking)
    const ownerDoc = await user.findById(current_user_id);
    const profileText = buildProfileText(created_profile_new, ownerDoc);
    generateEmbedding(profileText)
        .then(async (embeddingVector) => {
            if (embeddingVector) {
                created_profile_new.embedding = embeddingVector;
                await created_profile_new.save();
                console.log("[AI] Embedding generated for new profile:", created_profile_new._id);
            }
        })
        .catch((err) => console.error("[AI] Embedding generation failed:", err.message));

    }
    catch(err){
        console.log("err:",err);
        return res.send(err);
    }

};


module.exports.updateProfile=async(req,res)=>{
    const profileid=req.params.profileId;
    // const {error,value}=validators.profile_validator_update.validate(req.body);
   
    // if(error){
    //     console.log("schema validation of profile update fail");
    //     return res.send(error);
    // }
    // else{
    // console.log('Validated Data:', value);
    // if(Object.keys(value).length===0){
    //     return res.send("no fields to update!");
    // }
    // }
       try{
        const updated_profile=await profile.findOneAndUpdate({_id:profileid,owner:req.user._id},{$set:req.body},{new:true});
        console.log("updated profile is :",updated_profile);
        // res.send(` profile gets updated! : ${ updated_profile}`);
        res.status(200).json({
            message:"profile updated!",
            newprofile:updated_profile,
            status:true
        });

        // Regenerate AI embedding in background after profile update
        if (updated_profile) {
            const ownerDoc = await user.findById(req.user._id);
            const profileText = buildProfileText(updated_profile, ownerDoc);
            generateEmbedding(profileText)
                .then(async (embeddingVector) => {
                    if (embeddingVector) {
                        await profile.findByIdAndUpdate(profileid, { embedding: embeddingVector });
                        console.log("[AI] Embedding regenerated for profile:", profileid);
                    }
                })
                .catch((err) => console.error("[AI] Embedding regen failed:", err.message));
        }

       }

       catch(err){
        console.log("err:",err);
        return res.send(err);
       }
};



module.exports.deleteProfile=async (req,res)=>{
    const profileid=req.params.profileId;
    try{
        const profile_delete=await profile.findOneAndDelete({_id:profileid,owner:req.user._id});
        console.log("deleted profile is :",profile_delete);
        // This method finds the document, deletes it, and returns the deleted document, which is perfect for confirmation.

        // also delete the all post and comments and connection created by thid user
        
        res.send(`profile deleted successfully: ${profile_delete}`);
        
        const current_user_id=req.user._id;
        const current_user=await user.findOne({ _id: req.user._id });
        console.log(current_user);
        const current_profile_picture=current_user.profile_picture;
        console.log("current profile pic:",current_profile_picture);
        if(current_profile_picture){
            // delete the data from cloudinary.
            const deleted_result=await cloudinary.uploader.destroy(current_profile_picture.file_id);
            console.log("deleted result from cloudinary is :",deleted_result);
        }
        else{
            current_user.profile_picture.url=process.env.DEFAULT_PHOTO_URL;
            current_user.profile_picture.file_id="default_name";
            await current_user.save();
        }
        
    }
    catch(error){
        console.log("err:",error);
        return res.send(error);
    }
};

module.exports.downloadProfilePdf = async (req, res) => {
    try {
        const { userId } = req.params;
        // Fetch profile and populate user details (name, email)
        const userProfile = await profile.findOne({ owner: userId }).populate("owner");

        if (!userProfile) {
            return res.status(404).send("Profile not found");
        }

        const doc = new PDFDocument({ margin: 50 });

        // Set Headers for Streaming
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${userProfile.owner.full_name}_Resume.pdf"`);

        doc.pipe(res);

        // --- PDF CONTENT GENERATION ---
        doc.fontSize(25).text(userProfile.owner.full_name, { align: 'center' });
        doc.fontSize(12).text(userProfile.headline, { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(14).text("Professional Bio", { underline: true });
        doc.fontSize(10).text(userProfile.bio || "No bio provided.");
        doc.moveDown();

        // Loop through Experience
        doc.fontSize(14).text("Experience", { underline: true });
        userProfile.Experience.forEach(exp => {
            doc.fontSize(11).text(`${exp.title} at ${exp.company}`, { bullet: true });
            doc.fontSize(9).text(`${exp.from.toDateString()} - ${exp.current ? 'Present' : exp.to?.toDateString()}`);
        });

        doc.end(); // This triggers the streaming completion
    } catch (err) {
        console.error("PDF Generation Error:", err);
        res.status(500).send("Error generating PDF");
    }
};