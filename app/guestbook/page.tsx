import { db } from "@/lib/db";
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

const getPosts = async (offset: number) => {
    const postsQuery = await db.execute({
        sql: `SELECT post.*, user.username, user.name FROM post JOIN user ON post.user_id = user.id ORDER BY post.created_at DESC LIMIT 20 OFFSET ?`,
        args: [offset],
    });
    
    // Convert to plain objects and ensure correct types
    return (postsQuery.rows as any[]).map(row => ({
        id: String(row.id),
        message: String(row.message),
        created_at: Number(row.created_at),
        signature: row.signature ? String(row.signature) : null,
        username: String(row.username),
        name: row.name ? String(row.name) : undefined,
        user_id: String(row.user_id)
    })) as PostsQuery[];
};

const loadMorePosts = async (offset: number = 0) => {
    "use server";
    const posts = await getPosts(offset);
    const nextOffset = posts.length >= PAGE_SIZE ? offset + PAGE_SIZE : null;

    return [
        <AnimatedPosts posts={posts} key={offset} />,
        nextOffset,
    ] as const;
};

export default async function GuestbookPage() {
    const initialPosts = await getPosts(0);

    return (
        <Suspense fallback={<Loading />}>
            <LoadMore loadMoreAction={loadMorePosts} initialOffset={PAGE_SIZE}>
                <AnimatedPosts posts={initialPosts} />
            </LoadMore>
        </Suspense>
    );
}
