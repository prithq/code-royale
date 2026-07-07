import { Socket } from "socket.io";
import { auth } from "@code-royale/auth";

export async function socketAuthMiddleware(socket:Socket,next:(err?:Error)=>void) {
    try{
        const cookieHeader=socket.handshake.headers.cookie

        if(!cookieHeader)return next(new Error("No cookie for handshake"))

        const session=await auth.api.getSession({
            headers: new Headers({
                cookie:cookieHeader
            })
        })

         if (!session || !session.user) {
            return next(new Error("Unauthorized: invalid session"));
        }

        socket.data.user={
            id:session.user.id,
            name:session.user.name,
            email:session.user.email

        }

        next()


    }

    catch (err) {
    console.error("Socket auth error:", err);
    next(new Error("Unauthorized: session check failed"));


}
}