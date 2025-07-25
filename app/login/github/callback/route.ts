import { github, lucia } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { OAuth2RequestError } from "arctic";
import { generateId } from "lucia";

import type { DatabaseUser } from "@/lib/db";

interface GitHubUser {
    id: number;
    login: string;
    name: string;
    email: string;
    avatar_url: string;
}

type EmailInfo = {
    email: string;
    primary: boolean;
    verified: boolean;
    visibility: "private" | null;
};

type EmailList = EmailInfo[];

export async function GET(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = cookies().get("github_oauth_state")?.value ?? null;
    if (!code || !state || !storedState || state !== storedState) {
        return new Response(null, {
            status: 400,
        });
    }

    try {
        const tokens = await github.validateAuthorizationCode(code);
        const githubUserResponse = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${tokens.accessToken}`,
            },
        });
        const githubUser: GitHubUser = await githubUserResponse.json();
        const emailResponse = await fetch("https://api.github.com/user/emails", {
            headers: {
                Authorization: `Bearer ${tokens.accessToken}`,
            },
        });

        const githubUserEmails = (await emailResponse.json()) as EmailList;
        const primaryEmail = githubUserEmails.find((email: { primary: boolean }) => email.primary);

        if (!primaryEmail?.email || !primaryEmail.verified) {
            return new Response(
                JSON.stringify({
                    error: "Your github account must have a primary email address.",
                }),
                { status: 400, headers: { Location: "/login" } }
            );
        }

        const existingUserResult = await db.execute({
            sql: "SELECT id, username, github_id, name, email FROM user WHERE github_id = ? LIMIT 1",
            args: [githubUser.id],
        });

        const existingUser = existingUserResult.rows[0] as unknown as DatabaseUser | undefined;

        if (existingUser) {
            const session = await lucia.createSession(existingUser.id, {});
            const sessionCookie = lucia.createSessionCookie(session.id);
            cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
            return new Response(null, {
                status: 302,
                headers: {
                    Location: "/guestbook",
                },
            });
        }

        const userId = generateId(15);
        await db.execute({
            sql: "INSERT INTO user (id, github_id, username, name, email) VALUES (?, ?, ?, ?, ?)",
            args: [userId, githubUser.id, githubUser.login, githubUser.name ?? githubUser.login, primaryEmail.email],
        });

        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/guestbook",
            },
        });
    } catch (e) {
        if (e instanceof OAuth2RequestError && e.message === "bad_verification_code") {
            return new Response(null, {
                status: 400,
            });
        }

        console.log("ERROR:", e);

        return new Response(null, {
            status: 500,
        });
    }
}
