require("dotenv").config({path:require("path").resolve(__dirname,"../.env")});
const mongoose=require("mongoose");
const bcrypt=require("bcrypt");
const passwordValidator=require("../Utilities/passwordconstrain");
const Schema=mongoose.Schema;
const saltround=10;

const userSchema=new Schema({
    display_name:{
        type:String,
required: [true, "Your display name is required"],
    },
    full_name:{
        type:String,
required: [true, "Your full name is required"],
        unique:true
    },
    email:{
        type:String,
required: [true, "Your email is required"],
unique:true
    },
    password: {
        type: String,
        required: [true, "Your password is required"],
    },

    date_of_birth:{
        type:Date,
required: [true, "Your date of birth is required"],
    },
    gender:{
        type:String,
required: [true, "Your gender is required"],
    }
    ,
    profile_picture:{
        url :{
            type:String,
            default:process.env.DEFAULT_PHOTO_URL
        },
        file_id:{
            type:String,
            default:"default_name"
        }
    }
});

userSchema.pre("save", async function (next) {
    const User = this;

    // 1. Validate the password directly
    const isValid = passwordValidator(User.password);
    
    if (!isValid) {
        // If false, stop immediately and pass a clean error to Mongoose
        return next(new Error('Password must be at least 8 characters long and contain lowercase, uppercase, digit, special char, and no spaces.'));
    }

    // 2. Since the password is safe, proceed to hash it cleanly
    try {
        const salt = await bcrypt.genSalt(saltround);
        const hash = await bcrypt.hash(User.password, salt);

        User.password = hash;
        next(); // Tell Mongoose it's safe to save to the database!
    } catch (error) {
        next(error); // Catches unexpected system/hashing errors
    }
});


const user=mongoose.model("user",userSchema);
module.exports=user;