import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { application } from "express";
 

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500, "access token not generated")
    }
}

/*
1. display a registration page and input user info 
2.validate if user already exists: username , emails
3.check for images, avatars
4.upload them to cloudinary, avatar
5.create user object - create entry in db
6.remove password and refresh token field from response
7.check for user creation 
8.return response
*/

const registerUser = asyncHandler( async (req, res, next) => {
    const {fullName, email, username, password} = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field)=>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "all fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if(existedUser){
        throw new ApiError(409, "user with email and username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file is required")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500 , "something went wrong, user not created")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "Registration Complete")
    )
    next()
})

/*
1. req -> data
username or emial
find the user
password check
access and refresh token generate
send cookies
send response
*/

const loginUser = asyncHandler(async(req,res) =>{
    const {email, username, password} = req.body

    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(400, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(400, "invalid credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggesInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggesInUser, accessToken, refreshToken
            },
            "User Logged in successfully"
        )
    )


})

const logoutUser = asyncHandler(async(req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 

            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {} , "USER LoggedOut"))
})


const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "unauthorised request")
    }

    try {
        const decodedToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken" , accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "AccessTokenRefreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {

    const user = findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old Password")
    }

    user.password = newPassword

    await user.save({validateBeforeSave: false})

    return res.status(200)
    .json(new ApiResponse(200, {} , "Password change successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    //console.log(res.status(200))
    return res.status(200)
    .json(new ApiResponse(200, req.user , "current user export successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400, "all fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName: fullName,
                email: email,
            }
        },
        {new: true}
    ).select("-password")
    
    return res.status(200).json(new ApiResponse(200, user , "details updated"))
})

const updateAvatar = asyncHandler(async(req, res) =>{
    //steps
    /*
    get user
    authenticate
    remove old avatar
    get new avatar
    upload to cloudinary
    unlink from local server
    */
   const avatarLocalPath = req.files?.path

   if(!avatarLocalPath){
    throw new ApiError(400, "avatar required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
    throw new ApiError(400, "problem while uploading avatar")
   }

   const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set: {
            avatar: avatar.url
        }
    },
    {new: true}
   ).select("-password")

   return res
   .status(200)
   .json(
    new ApiResponse(200, user, "avatar updated")
   )

})

const updateCoverImage = asyncHandler(async(req, res) =>{
    //steps
    /*
    get user
    authenticate
    remove old avatar
    get new avatar
    upload to cloudinary
    unlink from local server
    */
   const coverImageLocalPath = req.files?.path

   if(!coverImageLocalPath){
    throw new ApiError(400, "avatar required")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!coverImage.url){
    throw new ApiError(400, "problem while uploading avatar")
   }

   await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set: {
            coverImage: coverImage.url
        }
    },
    {new: true}
   ).select("-password")

   return res
   .status(200)
   .json(
    new ApiResponse(200, user, "cover image updated")
   )

})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const { username } = req.params

    if(!username?.trim()){
        throw new ApiError(400, "missing the username")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                as: "subscribers",
                localField: "_id",
                foreignField: "channel"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                as: "subscribed_to",
                localField: "_id",
                foreignField: "subscriber"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "subscribed_to"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }

    ])

    if (!channel?.length){
        throw new ApiError(404, "channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users" ,
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $projects: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1   
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200 , user[0].watchHistory, "watch history fetched successfully")
    )

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}