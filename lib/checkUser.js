import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export const checkUser = async () => {
    // get the current user from clerk
    const user = await currentUser(); 

    // if tthe user is not found in CLERK then throw an error an return null
    if (!user) {
        throw new Error("User is not authenticated");
        return null;
    }
    // now check if the user exists in the DATABASE 
    try {
        // using the findUnique method to find the user by clerkUserId
        const loggedInUser = await db.user.findUnique({
            where: {
                clerkUserId: user.id,
            },
        }); 

        // if the user not found in the database, create a new user
        if (!loggedInUser) {
            const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
            const newUser = await db.user.create({
                data: {
                    clerkUserId: user.id,   
                    name : fullName,
                    email: user.emailAddresses[0]?.emailAddress ,
                    imageUrl : user.profileImageUrl ,
                    
                },
            });
            //returning the new created user 
            return newUser; 
        }
        // if the user is found, return the user
        return loggedInUser;
    } 
    catch (error) {

        console.error("Error checking user:", error);
        throw error;


    }
};
