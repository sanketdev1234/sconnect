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

userSchema.pre("save",  function (next) {
    const User = this;
    //validat the password
    passwordValidator(User.password,function(err){
        if(err) return next(err);
    // Step 2: Generate salt
    bcrypt.genSalt(saltround, function (err, salt) {
      // Step 3: Hash the password using the salt
    bcrypt.hash(User.password, salt, function (err, hash) {
        // Step 4: Replace plain password with hashed password
        User.password = hash;
        // Step 5: Continue with saving the user
        next();
        });
    });
    })
    });


const user=mongoose.model("user",userSchema);
module.exports=user;