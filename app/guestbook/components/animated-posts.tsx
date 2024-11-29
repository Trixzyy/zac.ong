'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { PostsQuery } from "@/app/guestbook/page";

interface AnimatedPostsProps {
    posts: PostsQuery[]
}

const AnimatedPosts = ({ posts }: AnimatedPostsProps) => {
    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants = {
        hidden: { 
            opacity: 0, 
            y: 20, 
            scale: 0.95
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 12,
                duration: 0.5
            }
        }
    };

    return (
        <motion.ul 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-12 gap-6 mt-8"
        >
            {posts.map((post) => (
                <motion.li 
                    key={post.id} 
                    variants={itemVariants}
                    className="flex col-span-12 sm:col-span-6"
                >
                    <div className="rounded-xl flex flex-col justify-between space-y-4 h-full w-full p-6 bg-white/5 dark:bg-grey-900/20 border border-grey-200/20 dark:border-grey-800/20 transition-colors">
                        <p className="leading-relaxed text-grey-900 dark:text-grey-50">{post.message}</p>

                        <div className="flex items-center justify-between">
                            <div className="flex flex-col text-sm">
                                {post.name ? (
                                    <p className="font-medium text-grey-900 dark:text-grey-100">{post.name}</p>
                                ) : (
                                    <p className="font-medium text-grey-900 dark:text-grey-100">@{post.username}</p>
                                )}

                                <p className="text-grey-500 dark:text-grey-400">
                                    {new Date(post.created_at * 1000).toLocaleString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>
                            {post.signature && (
                                <div className="dark:invert opacity-80">
                                    <Image 
                                        alt="signature" 
                                        src={post.signature} 
                                        width={180}
                                        height={180}
                                        className="select-none"
                                        priority
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </motion.li>
            ))}
        </motion.ul>
    );
};

export default AnimatedPosts;