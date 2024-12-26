"use server";

import { generateId } from "lucia";
import { auth } from "../auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

type SignResponse = {
    success: boolean;
    error?: string;
};

export async function sign(formData: FormData): Promise<SignResponse> {
    const { user } = await auth();
    const message = formData.get("message") as string;
    const signature = formData.get("signature") as string;

    if (!user) {
        return {
            success: false,
            error: "You must be logged in to sign the guestbook",
        };
    }

    // query to check if the user has made a post ever
    const hasMadePostQuery = await db.execute({
        sql: "SELECT * FROM post WHERE user_id = ?",
        args: [user.id],
    });

    if (message.length > 150) {
        return {
            success: false,
            error: "Message cannot exceed 150 characters long",
        };
    }

    // Combined regex for various spam checks
    const spamRegex = /(.)\1{4,}|(.{2,})\2{2,}|[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{5,}|(https?:\/\/[^\s]+)/g;
     
    if (spamRegex.test(message)) {
        return {
            success: false,
            error: "Message contains invalid characters or spam.",
        };
    }

    // if post, prevent them from making another post
    if (hasMadePostQuery.rows.length) {
        return {
            success: false,
            error: "You have already signed the guestbook",
        };
    }
    
    await db.execute({
        sql: "INSERT INTO post (id, created_at, message, user_id, signature) VALUES (?, ?, ?, ?, ?)",
        args: [generateId(15), Math.floor(Date.now() / 1000), message, user.id, signature],
    });

    revalidatePath("/guestbook");
    return { success: true };
}
