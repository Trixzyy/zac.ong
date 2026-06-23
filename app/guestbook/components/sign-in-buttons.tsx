import { Button } from "@/components/button";
import { DiscordIcon } from "@/components/ui/DiscordIcon";
import { GithubIcon } from "@/components/ui/GithubIcon";

export function SignInButtons() {
    return (
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Button
                href="/login/github"
                color="light"
                className="hover:scale-105 transition-transform w-full sm:w-auto flex items-center justify-center gap-2"
            >
                <GithubIcon />
                <span className="whitespace-nowrap">Sign in with GitHub</span>
            </Button>
            <Button
                href="/login/discord"
                color="light"
                className="hover:scale-105 transition-transform w-full sm:w-auto flex items-center justify-center gap-2"
            >
                <DiscordIcon />
                <span className="whitespace-nowrap">Sign in with Discord</span>
            </Button>
        </div>
    );
}
