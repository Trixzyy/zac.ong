import { Button } from "@/components/button";
import { auth } from "@/lib/auth";
import { SignDialog } from "./sign-dialog";
import { logout } from "@/lib/actions/logout";
import { MotionDiv } from "@/components/motion";
import { GithubIcon } from "@/components/ui/GithubIcon";
import { SignOutIcon } from "@/components/ui/SignoutIcon";

interface RootLayoutProps {
    children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
    const { user } = await auth();

    const variant = {
        hidden: { opacity: 0, y: -5 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { 
            opacity: 1, 
            scale: 1, 
            transition: { duration: 0.4, delay: 0.2 } 
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="font-medium text-3xl tracking-tight">Guestbook</h1>
                        <p className="text-grey-500 dark:text-grey-400">Leave your mark, share your thoughts.</p>
                    </div>

                    <div className="mt-4 sm:mt-0">
                        {user ? (
                            <div className="flex flex-row gap-4 items-center">
                                <SignDialog user={user} />
                                <form action={logout}>
                                    <Button plain type="submit" className="flex items-center gap-2">
                                        <SignOutIcon />
                                        <span className="hidden sm:inline">Sign out</span>
                                    </Button>
                                </form>
                            </div>
                        ) : (
                            <Button 
                                href="/login/github" 
                                color="light" 
                                className="hover:scale-105 transition-transform w-full sm:w-auto flex items-center justify-center gap-2"
                            >
                                <GithubIcon />
                                <span className="whitespace-nowrap">Sign in with GitHub</span>
                            </Button>
                        )}
                    </div>
                </div>
            </MotionDiv>

            <MotionDiv 
                initial="hidden" 
                animate="visible" 
                variants={cardVariants} 
                className="mt-8"
            >
                {children}
            </MotionDiv>
        </section>
    );
}
