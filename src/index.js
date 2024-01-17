//require('dotebv').config({path: './env'})

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
    path: './.env'
})


connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server is running at port : ${process.env.PORT}`);

    })
})

.catch((err) => {
    console,log("mongo db connection failed !!!" , err);
})



/*
import express from "express"

const app = express()

;(async () => {
    try{
        await mongoose.connect(`${process.env.
            MONGODB_URI}/${DB_NAME}`)
            app.on("error", () => {
                console.log("err: ", error);
                throw error
            })

            app.listen(process.env.PORT, () => {
                console.log(`app is listening on port $
                {process.env.PORT}`);

            })
    }
    catch(error){
        console.error("Error: " , error)
        throw error 
    }
})()

*/

