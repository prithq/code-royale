import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {prisma} from "@code-royale/db"

export const auth=betterAuth({
    database:prismaAdapter(prisma,{
        provider:"postgresql"
    }),
    emailAndPassword:{
        enabled:true
    },
    secret:process.env.BETTER_AUTH_SECRET,
    
    socialProviders:{
        github:{
            clientId:process.env.GITHUB_CLIENT_ID as string,
            clientSecret:process.env.GITHUB_CLIENT_SECRET as string
        },
        google: { 
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
        }
    },

    trustedOrigins:[
        "http://localhost:3000",
        "http://localhost:3001"
    ],
    baseURL:"http://localhost:3001"
        
    
})
