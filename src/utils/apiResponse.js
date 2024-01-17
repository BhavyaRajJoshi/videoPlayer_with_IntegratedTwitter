class ApiResponse{
    constructor(statusCode, data, message = "Success"){
        this.data = data
        this.statusCode = statusCode
        this.message = message
        this.success = success < 400
    }
}

export {ApiResponse}

