import { Post } from "@/.contentlayer/generated";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BlogPostItemProps {
    post: Post;
    isHovered: boolean;
    onHover: (id: string | null) => void;
    hoveredId: string | null;
}

export default function BlogPostItem({ post, isHovered, onHover, hoveredId }: BlogPostItemProps) {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setMousePosition({
                x: e.clientX,
                y: e.clientY,
            });
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative py-3"
            onMouseEnter={() => onHover(post._id)}
            onMouseLeave={() => onHover(null)}
            onMouseMove={handleMouseMove}
        >
            <Link href={post.slug}>
                <article className={`transition-opacity duration-300 ${
                    !isHovered && hoveredId ? 'opacity-30' : 'opacity-100'
                }`}>
                    <div className="flex items-center justify-between group">
                        <h2 className="text-lg font-medium group-hover:underline decoration-1 underline-offset-2">
                            {post.title}
                        </h2>
                        <span className="text-sm text-grey-500 shrink-0 ml-4">
                            {formatDistance(new Date(post.date), new Date(), {
                                addSuffix: true,
                            })}
                        </span>
                    </div>
                    {post.description && (
                        <p className="text-sm text-grey-400 mt-1 line-clamp-1">
                            {post.description}
                        </p>
                    )}
                    {post.tags && (
                        <div className="flex gap-2 mt-2">
                            {post.tags.map((tag) => (
                                <span 
                                    key={tag} 
                                    className="text-xs px-2 py-0.5 rounded-full bg-grey-100/10 text-grey-400"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </article>
            </Link>
        </div>
    );
} 