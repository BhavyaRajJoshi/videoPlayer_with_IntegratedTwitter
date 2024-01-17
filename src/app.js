import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended : true, limit: "16kb"}))//toencode url
app.use(express.static("publicfolder"))//to store in own server
app.use(cookieParser)//access user cookies through browser directly
 
export {app}