import rateLimit from "express-rate-limit";

export const authLimiter=rateLimit({
    windowMs:60*1000,
    max:10,
    message:{error:"too many request, try later in a min"},
    standardHeaders:true,
    legacyHeaders:true
})

export const apiLimiter=rateLimit({
    windowMs:60*1000,
    max:100,
    message:{error:"too many requests,try again"},
    standardHeaders: true,
  legacyHeaders: false,
})