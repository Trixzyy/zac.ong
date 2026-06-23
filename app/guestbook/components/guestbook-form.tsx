"use client";

import { Button } from "@/components/button";
import { Field, Label } from "@/components/fieldset";
import { SignaturePad, cn } from "@/components/signature-pad";
import { Textarea } from "@/components/textarea";
import { sign } from "@/lib/actions/sign";
import type { User } from "lucia";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

type GuestbookFormProps = {
    user: User;
};

export function GuestbookForm({ user }: GuestbookFormProps) {
    const [localSignature, setLocalSignature] = useState<string>("");
    const [textInvalid, setTextInvalid] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormLoading(true);
        const formData = new FormData(event.target as HTMLFormElement);

        if (!formData.get("message")) {
            setTextInvalid(true);
            toast.error("Please enter a message");
            setFormLoading(false);
            return;
        }

        setTextInvalid(false);
        formData.append("signature", localSignature);

        try {
            const response = await sign(formData);
            if (response.success) {
                (event.target as HTMLFormElement).reset();
                setLocalSignature("");
            } else {
                toast.error(response.error);
            }
        } catch {
            toast.error("An unexpected error occurred. Please try again later.");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-xl p-6 bg-white/5 dark:bg-grey-900/20 border border-grey-200/20 dark:border-grey-800/20 space-y-4"
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-sm text-grey-600 dark:text-grey-400">
                    Signed in as <span className="font-medium text-grey-900 dark:text-grey-100">{user.name ?? user.username}</span>
                </p>
                <a
                    href="/logout"
                    className="text-sm text-grey-500 hover:text-grey-900 dark:text-grey-400 dark:hover:text-grey-100 transition-colors"
                >
                    Sign out
                </a>
            </div>

            <Field>
                <Label>Leave a message</Label>
                <Textarea invalid={textInvalid} rows={3} name="message" />
            </Field>

            <Field>
                <Label>Sign here</Label>
                <SignaturePad
                    className={cn(
                        "aspect-video h-40 mt-2 w-full rounded-lg border bg-transparent shadow dark:shadow-none",
                        "border border-grey-950/10 dark:border-black/10",
                        "bg-transparent dark:bg-black/5"
                    )}
                    onChange={(value) => setLocalSignature(value ?? "")}
                />
            </Field>

            <Button disabled={formLoading} type="submit">
                Submit
            </Button>
        </form>
    );
}
