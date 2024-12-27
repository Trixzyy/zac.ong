import { Post } from "@/.contentlayer/generated";
import { motion, AnimatePresence } from "framer-motion";

interface BlogThumbnailProps {
    hoveredPost: Post | null;
    mousePosition: { x: number; y: number };
}

export default function BlogThumbnail({ hoveredPost, mousePosition }: BlogThumbnailProps) {
    return (
        <AnimatePresence>
            {hoveredPost && hoveredPost.image && (
                <motion.div
                    key={hoveredPost._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed pointer-events-none"
                    style={{
                        left: mousePosition.x + 20,
                        top: mousePosition.y - 60,
                        width: '240px',
                        height: '135px',
                    }}
                >
                    <img
                        src={hoveredPost.image}
                        alt={hoveredPost.title}
                        className="w-full h-full object-cover"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
} 