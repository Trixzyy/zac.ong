/**
 * Shared motion identity for Music page.
 * Top Artists & Recent Tracks use matching variants; scroll-triggered uses whileInView.
 */
export const musicMotion = {
  stagger: 0.06,
  duration: 0.3,
  rowVariants: {
    hidden: { opacity: 0, y: 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  },
  containerVariants: {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.06 },
    },
  },
  viewport: { once: true, amount: 0.2 },
};
