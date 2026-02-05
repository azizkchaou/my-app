import { Inngest } from "inngest";

//create a client to send and receive events
export const inngest = new Inngest({
    id: "my-app" ,
    name: "TuniFia App Inngest Client" ,
    retryFunctions : async (attempt) => ({
        delay: Math.pow(2, attempt) * 1000, // Exponential backoff: 1s, 2s, 4s, 8s...
        maxAttempts: 5,
    }),
});
