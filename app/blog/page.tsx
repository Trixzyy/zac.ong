'use client';

import { allPosts } from "@/.contentlayer/generated";
import { MotionDiv } from "@/components/motion";
import Link from "next/link";
import React, { useState } from "react";
import BlogPostItem from "@/components/blog/BlogPostItem";
import BlogThumbnail from "@/components/blog/BlogThumbnail";

const variant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
};

export default function BlogPage() {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const hoveredPost = hoveredId ? allPosts.find(post => post._id === hoveredId) ?? null : null;

    return (
        <MotionDiv 
            initial="hidden" 
            animate="visible" 
            variants={variant}
            onMouseMove={handleMouseMove}
        >
            <div className="max-w-2xl">
                <h1 className="font-medium text-3xl tracking-tight mb-8">Blog</h1>

                <div className="divide-y divide-grey-100/10">
                    {allPosts
                        .filter((post) => !post.archived)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((post) => (
                            <BlogPostItem
                                key={post._id}
                                post={post}
                                isHovered={hoveredId === post._id}
                                onHover={setHoveredId}
                                hoveredId={hoveredId}
                            />
                        ))}
                </div>

                <Link
                    href="archive"
                    className="text-sm mt-12 inline-block decoration-grey-100 "
                >
                    View Archived Posts
                </Link>
            </div>

            <BlogThumbnail 
                hoveredPost={hoveredPost}
                mousePosition={mousePosition}
            />
        </MotionDiv>
    );
}
