import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    try {
        const {content} = req.body
    
        if (!content){
            throw new ApiError(400, "no content")
        }
    
        const owner = await User.findById(req.user?._id)
    
        const newTweet = new Tweet({
            content,
            owner
        })

        await newTweet.save()

        res.status(200)
        .json( new ApiResponse(200, newTweet, "new tweet created"))
    } catch (error) {
        console.error(error)
        throw new ApiError(400, "problem in creating a tweet.")
    }


})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}