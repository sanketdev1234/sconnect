const cloudinary=require("cloudinary");
const CloudinaryStorage=require("multer-storage-cloudinary");
require("dotenv").config({path:require("path").resolve(__dirname,"../.env"  )});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage=new CloudinaryStorage({
    cloudinary:cloudinary,
    params:{
        folder:"social-media-app-profile-picture",
        allowedFormats:["png","jpeg","jpg"],
    }
});

module.exports={storage};


