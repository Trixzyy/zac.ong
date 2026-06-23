import { discord, lucia } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { OAuth2RequestError } from "arctic";
import { generateId } from "lucia";

interface DiscordUser {
    id: string;
    username: string;
    global_name: string | null;
    email: string;
}

/** Placeholder github_id for Discord-only users (github_id remains NOT NULL in legacy schema). */
function githubPlaceholderForDiscord(discordId: string): number {
    let hash = 5381;
    for (let i = 0; i < discordId.length; i++) {
        hash = (hash * 33) ^ discordId.charCodeAt(i);
    }
    const value = hash | 0;
    if (value === 0) return -1;
    return value > 0 ? -value : value;
}

export async function GET(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = cookies().get("discord_oauth_state")?.value ?? null;
    cookies().delete("discord_oauth_state");

    if (!code || !state || !storedState || state !== storedState) {
        return new Response(null, {
            status: 400,
        });
    }

    try {
        const tokens = await discord.validateAuthorizationCode(code);
        const discordUserResponse = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${tokens.accessToken}`,
            },
        });
        const discordUser: DiscordUser = await discordUserResponse.json();

        if (!discordUser.email) {
            return new Response(
                JSON.stringify({
                    error: "Your Discord account must have a verified email address.",
                }),
                { status: 400, headers: { Location: "/login" } }
            );
        }

        const discordId = discordUser.id;

        const existingUserResult = await db.execute({
            sql: "SELECT id FROM user WHERE discord_id = ? LIMIT 1",
            args: [discordId],
        });

        const existingUserId = existingUserResult.rows[0]?.id as string | undefined;

        if (existingUserId) {
            const session = await lucia.createSession(existingUserId, {});
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
        const displayName = discordUser.global_name ?? discordUser.username;

        await db.execute({
            sql: "INSERT INTO user (id, github_id, discord_id, username, name, email, provider) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [
                userId,
                githubPlaceholderForDiscord(discordId),
                discordId,
                discordUser.username,
                displayName,
                discordUser.email,
                "discord",
            ],
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
        if (e instanceof OAuth2RequestError) {
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
