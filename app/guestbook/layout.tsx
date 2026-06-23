import { MotionDiv } from "@/components/motion";

interface RootLayoutProps {
    children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
    const variant = {
        hidden: { opacity: 0, y: -5 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.4, delay: 0.2 },
        },
    };

    return (
        <section>
            <MotionDiv
                initial="hidden"
                animate="visible"
                variants={variant}
                className="space-y-6 rounded-xl"
            >
                <div className="space-y-1">
                    <h1 className="font-medium text-3xl tracking-tight">Guestbook</h1>
                    <p className="text-grey-500 dark:text-grey-400">Leave your mark, share your thoughts.</p>
                </div>
            </MotionDiv>

            <MotionDiv initial="hidden" animate="visible" variants={cardVariants} className="mt-8">
                {children}
            </MotionDiv>
        </section>
    );
}
