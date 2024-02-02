import mongoose, {isValidObjectId} from "mongoose";
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken";
import { application } from "express";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    /*
    */
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    /*
    check user
    get path
    upload on cloudinary
    send response
    */
    const videoLocalPath = req.files?.videoFile[0]?.path

    if(!videoLocalPath){
        throw new ApiError(400, "no video path uploaded")
    }
    const video = await uploadOnCloudinary(videoLocalPath)

    if(!video){
        throw new ApiError(400, "no video uploaded")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!thumbnailLocalPath){
        throw new ApiError(400, "no video path uploaded")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail){
        throw new ApiError(400, "no video uploaded")
    }

    const duration = video.duration
    //const videoOwner = findById(req.user?._id)

    const videofile = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail.url,
        title: title,
        description: description,
        duration: duration,
    })

    return res.status(201).json(
        new ApiResponse(200, {}, "video published")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const {videoId}  = req.params
    //TODO: get video by id
    /*
    */
    const video = await Video.findById(videoId);

    // if (!video) {
    //     // If the video with the given ID is not found, return a 404 response
    //     throw new ApiError(400, "video not found")
    // }

   return res.status(200).json(new ApiResponse(200, {videoId} , "current video export successfully"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    /*
    */
    if(!videoId){
        throw new ApiError(400, "videoId required")
    }

    const {title, description, thumbnail} = req.body

    if(!title || !description){
        throw new ApiError(400, "details required")
    }

    const video = await Video.findByIdAndUpdate(
        req.video?._id,
        {
            $set:{
                title: title,
                description: description,
            }
        },
        {new: true}
    )

    return res.status(200).json(new ApiResponse(200, video , "details updated"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!videoId){
        throw new ApiError(400, "no video id received")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)

    if(!deletedVideo){
        throw new ApiError(400, "problem deleting video")
    }

    res.status(200)
    .json(new ApiResponse(200, deletedVideo, "video deleted successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId){
        throw new ApiError(400, "no video id received")
    }

    const video = await Video.findById(videoId)

    if(!video){
        // throw new ApiError(400, "video not found")
        video.isPublished = !video.isPublished
        await video.save()
    }

    res.status(200)
    .json(200, video, "video status toggled")
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}