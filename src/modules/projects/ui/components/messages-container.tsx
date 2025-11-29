import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MessageCard } from "./message-card";
import { MessageForm } from "./message-form";
import { useEffect, useRef, useState } from "react";
import { Fragment } from "@/generated/prisma";
import { MessageLoading } from "./message-loading";

interface Props {
    projectId: string;
};

export const MessagesContainer = ({ projectId }: Props) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const trpc = useTRPC();
    const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
    
    const { data: messages } = useSuspenseQuery(trpc.messages.getMany.queryOptions({ projectId }, { refetchInterval: 5000 }));

    // Track the last message count to only auto-select when new messages arrive
    const messageCountRef = useRef(messages.length);
    
    useEffect(() => {
        // Only auto-select fragment on initial load or when a new message with fragment is added
        // Don't override user's manual selection
        const hasNewMessages = messages.length > messageCountRef.current;
        messageCountRef.current = messages.length;
        
        if (activeFragment === null || hasNewMessages) {
            const lastAssistantMessageWithFragment = messages.findLast(
                (message) => message.role === "ASSISTANT" && !!message.fragment
            );

            if (lastAssistantMessageWithFragment) {
                // Only set if it's different from current selection
                if (activeFragment?.id !== lastAssistantMessageWithFragment.fragment.id) {
                    setActiveFragment(lastAssistantMessageWithFragment.fragment);
                }
            }
        }
    }, [messages, setActiveFragment, activeFragment]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const lastMessage = messages[messages.length - 1];
    const isLastMessageUser = lastMessage?.role === "USER";

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-y-scroll">
                <div className="pt-2 pr-1">
                    {messages.map((message) => (
                        <MessageCard
                            key={message.id}
                            content={message.content}
                            role={message.role}
                            fragment={message.fragment}
                            createdAt={message.createdAt}
                            isActiveFragment={!!(activeFragment && message.fragment && activeFragment.id === message.fragment.id)}
                            onFragmentClick={(frag) => {
                                if (activeFragment?.id === frag.id) {
                                    setActiveFragment(null);
                                } else {
                                    setActiveFragment(frag);
                                }
                            }}
                            type={message.type}
                        />
                    ))}
                    {isLastMessageUser && <MessageLoading />}
                    <div ref={bottomRef} />
                </div>
            </div>
            <div className="relative p-3 pt-1">
                <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/70 pointer-events-none" />
                <MessageForm projectId={projectId} />
            </div>
        </div>
    )
}