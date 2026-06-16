const joi=require("joi");

const user_validator=joi.object({
    display_name:joi.string().min(3).max(30).required(),
    full_name:joi.string().pattern(/^[A-Za-z\s]+$/, 'alphabets and spaces').required(),
    email:joi.string().email({
        tlds:{allow:['com','net']},
        minDomainSegments:2
    }).required(),
    password:joi.string().required(),
    date_of_birth:joi.date().required(),
    gender:joi.string().required(),
    profile_picture:joi.string().uri().allow(null, '')
});

const meeting_validator=joi.object({
     Joining_id:joi.string().required(),
    StartAt:joi.date().required(),
    EndAt:joi.date().allow(null, ''),
    isEnded:joi.boolean().allow(null, '')
});



    const Education=joi.object({
        school:joi.string().required(),
        degree:joi.string().required(),
        field_of_study:joi.string().required(),
        from:joi.date().required(),
        to:joi.date().allow(null, ''),
        current:joi.boolean().allow(null, ''),
        gpa:joi.number().min(0).max(10.0).allow(null, ''),
        description:joi.string().allow(null, ''),
    });

   const  Experience=joi.object({
        company:joi.string().required(),
        title:joi.string().required(),
        location:joi.string().allow(null, ''),
        from:joi.date().required(),
        to:joi.date().allow(null, ''),
        current:joi.boolean().allow(null, ''),
        description:joi.string().allow(null, '')
    });

const profile_validator=joi.object({
    bio:joi.string().allow(null, ''),
    headline:joi.string().required(),
    location:joi.string().allow(null, ''),
    social:joi.object({
        twitter:joi.string().allow(null, ''),
        github:joi.string().allow(null, ''),
        linkedin:joi.string().allow(null, '')
    }),

    Education:joi.array().items(Education),
    Experience:joi.array().items(Experience)

});



const profile_validator_update=joi.object({
    bio:joi.string().allow(null, '').optional(),
    headline:joi.string().optional(),
    location:joi.string().allow(null, '').optional(),
    social:joi.object({
        twitter:joi.string().allow(null, '').optional(),
        github:joi.string().allow(null, '').optional(),
        linkedin:joi.string().allow(null, '').optional()
    }).optional(),
// The entire social object can be omitted

    // 3. Arrays: The array itself is optional, but items inside must be valid if the array is provided
    Education:joi.array().items(Education).optional(),
    Experience:joi.array().items(Experience).optional()
});

module.exports={user_validator,meeting_validator,profile_validator,profile_validator_update};


