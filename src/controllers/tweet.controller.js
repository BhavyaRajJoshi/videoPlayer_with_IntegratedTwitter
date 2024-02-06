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
    //const user = User.findById(req.user?._id)

    const userTweets = await Tweet.find({owner: req.user?._id})

    res.status(200)
    .json(new ApiResponse(200, userTweets, "user tweets export successfully."))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    try {
        const { newContent } = req.body;
    
        // Check if newContent is provided
        if (!newContent) {
          throw new ApiError(400, "New content is required for updating a tweet");
        }
    
        // Update tweets based on the owner's ID
        const updatedTweets = await Tweet.updateMany(
          { owner: req.user?._id },
          { $set: 
            { content: newContent }
        }, {new : true}
        );
    
        res.status(200)
        .json(new ApiResponse(200, updatedTweets, "Tweets updated successfully"));
      } catch (error) {

        throw new ApiError(200, error, "cannot update tweet")
      }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const tweetId = req.params.tweetId

    if(!tweetId){
        throw new ApiError(200, "cannot get the tweet to delete")
    }

    await findByIdAndDelete(tweetId)

    res.status(200)
    .json(200, "tweet deleted successfully")

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}