import { Suspense } from "react";
import Loading from "./loading";
import LoadMore from "./loadmore";
import AnimatedPosts from "./components/animated-posts";

const PAGE_SIZE = 20;

export type PostsQuery = {
    id: string;
    message: string;
    created_at: number;
    signature: string | null;
    username: string;
    name: string | null;
    user_id: string;
};

// Direct fetch implementation using Turso HTTP API
const directFetch = async (url: string, options: RequestInit = {}) => {
    const token = process.env.TURSO_AUTH_TOKEN;
    if (!token) {
        console.error("[Guestbook] TURSO_AUTH_TOKEN is missing!");
        throw new Error("Missing authentication token.");
    }
    
    const headers = {
        ...options.headers,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
    };
    
    const response = await fetch(url, {
        ...options,
        headers,
    });
    
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[Guestbook] HTTP error ${response.status} for ${url}: ${errorBody}`);
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
};

// Fetches posts directly using the Turso HTTP API
const getPostsDirect = async (offset: number): Promise<PostsQuery[]> => {
    try {
        const dbUrl = process.env.TURSO_DATABASE_URL;
        if (!dbUrl) throw new Error("TURSO_DATABASE_URL environment variable is required");
        
        const match = dbUrl.match(/libsql:\/\/([^/]+)/);
        if (!match) throw new Error("Invalid TURSO_DATABASE_URL format");
        
        const hostname = match[1];
        const apiUrl = `https://${hostname}/v2/pipeline`; 
        
        const result = await directFetch(apiUrl, {
            method: "POST",
            body: JSON.stringify({
                "requests": [
                    {
                        "type": "execute",
                        "stmt": {
                            "sql": `SELECT post.*, user.username, user.name FROM post JOIN user ON post.user_id = user.id ORDER BY post.created_at DESC LIMIT 20 OFFSET ?`,
                            "args": [
                                {
                                    "type": "integer",
                                    "value": String(offset)
                                }
                            ]
                        }
                    }
                ]
            }),
        });
        
        const queryResult = result?.results?.[0];
        if (!queryResult || queryResult.type !== 'ok' || !queryResult.response?.result?.rows) {
            console.warn("[Guestbook] No posts found or unexpected response format from API.", queryResult);
            return [];
        }
        
        const columns = queryResult.response.result.cols.map((col: any) => col.name);
        const rows = queryResult.response.result.rows;
        
        return rows.map((rowValues: any[]) => {
            const row: any = {};
            columns.forEach((colName: string, index: number) => {
                row[colName] = rowValues[index]?.value;
            });
            
            return {
                id: String(row.id),
                message: String(row.message),
                created_at: Number(row.created_at),
                signature: row.signature ? String(row.signature) : null,
                username: String(row.username),
                name: row.name ? String(row.name) : undefined,
                user_id: String(row.user_id)
            };
        }) as PostsQuery[];
        
    } catch (error) {
        console.error("[Guestbook] Error fetching posts via direct API:", error);
        // Return empty array on error to avoid breaking the page
        return []; 
    }
};

// Server action for loading more posts
const loadMorePosts = async (offset: number = 0) => {
    "use server";
    const posts = await getPostsDirect(offset);
    const nextOffset = posts.length >= PAGE_SIZE ? offset + PAGE_SIZE : null;

    return [
        <AnimatedPosts posts={posts} key={offset} />,
        nextOffset,
    ] as const;
};

// Guestbook page component
export default async function GuestbookPage() {
    // Fetch initial posts using the direct API method
    const initialPosts = await getPostsDirect(0);

    return (
        <Suspense fallback={<Loading />}>
            <LoadMore loadMoreAction={loadMorePosts} initialOffset={PAGE_SIZE}>
                <AnimatedPosts posts={initialPosts} />
            </LoadMore>
        </Suspense>
    );
}
