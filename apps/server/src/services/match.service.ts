import {prisma} from "@code-royale/db"


export async function selectProblems(categories:string[],count:number) {
    const problems=await prisma.problem.findMany({
        where:{
            categories:{hasSome:categories}
        },
        select:{
            id:true,
            title:true,
            description:true,
            categories:true,
            difficulty:true
        }
    })





    if(problems.length===0)
        throw new Error("no problems found for selected categories")

    const shuffled=problems.sort(()=>Math.random()-0.5)
    return shuffled.slice(0,count)
}



export async function computeLeaderboard(matchId:string) {
    
    const players=await prisma.matchPlayer.findMany({
        where:{
            matchId
        },
        include:{
            user:{
                select:{
                    id:true,
                    name:true
                }
            }
        },
        orderBy:{score:"desc"}
    })



    return players.map((p,index)=>({
        rank:index+1,
        userId:p.userId,
        playerName:p.user.name,
        score:p.score
    }))
}