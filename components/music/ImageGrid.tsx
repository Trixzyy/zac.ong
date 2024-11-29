import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AlbumCard from './AlbumCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

interface ImageGridProps {
  albums: any[];
  isLoading: boolean;
}

const LoadingSkeleton = () => (
  <div className="overflow-hidden rounded-md flex flex-col md:flex-row h-full">
    <div className="w-full md:w-1/2 flex-shrink-0">
      <div className="relative aspect-square bg-white/5 dark:bg-grey-900/20 border border-grey-200/20 dark:border-grey-800/20">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70" />
      </div>
    </div>
    <div className="w-full md:w-1/2 grid grid-cols-2">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="relative aspect-square bg-white/5 dark:bg-grey-900/20 border border-grey-200/20 dark:border-grey-800/20">
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70" />
        </div>
      ))}
    </div>
  </div>
);

export default function ImageGrid({ albums, isLoading }: ImageGridProps) {
  return (
    <div className="relative w-full">
      <div className="aspect-[1/2] md:aspect-[2/1]">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              className="absolute inset-0"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LoadingSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              className="absolute inset-0 overflow-hidden rounded-md flex flex-col md:flex-row"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="w-full md:w-1/2 flex-shrink-0" variants={itemVariants}>
                <AlbumCard album={albums[0]} isLarge={true} />
              </motion.div>
              <div className="w-full md:w-1/2 grid grid-cols-2">
                {albums.slice(1, 5).map((album, index) => (
                  <motion.div key={index} variants={itemVariants}>
                    <AlbumCard album={album} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}