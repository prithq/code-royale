type BucketEntry={
    count:number,
    resetAt:number
}

//the key is socketID:eventname
const buckets:Record<string,BucketEntry>={}

setInterval(()=>{

    const now=Date.now()

    for(const key of Object.keys(buckets)){
        const bucket = buckets[key]
        if(bucket && bucket.resetAt < now){
            delete buckets[key]
        }
    }

},5*60*1000)

export function isRateLimited(
    socketId:string,
    event:string,
    maxRequests:number,
    windowMs:number
):boolean{

    const key =`${socketId}:${event}`
    const now=Date.now()

    if(!buckets[key] || buckets[key].resetAt<now){
        buckets[key]={
             count: 1,
              resetAt: now + windowMs 
            };

            return false
    }

    buckets[key].count++

    if(buckets[key].count>maxRequests)
        return true

    return false
}

// for socket disconnection
export function clearSocketBuckets(socketId: string) {
  for (const key of Object.keys(buckets)) {
    if (key.startsWith(socketId)) {
      delete buckets[key];
    }
  }
}