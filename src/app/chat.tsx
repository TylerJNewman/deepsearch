"use client";

import { ChatMessage } from "~/components/chat-message";
import { ErrorMessage } from "~/components/error-message";
import { RateLimitError } from "~/components/rate-limit-error";
import { SignInModal } from "~/components/sign-in-modal";
import { useChat } from "@ai-sdk/react";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Message } from "ai";
import { isNewChatCreated } from "~/utils";
import { StickToBottom } from "use-stick-to-bottom";

interface ChatProps {
  userName: string;
  chatId: string;
  isNewChat: boolean;
  initialMessages?: Message[];
}

interface RateLimitErrorData {
  error: string;
  message: string;
  requestsToday: number;
  dailyLimit: number;
  resetTime?: string;
}

export const ChatPage = ({ userName, chatId, isNewChat, initialMessages }: ChatProps) => {
  const { data: session, status } = useSession();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<RateLimitErrorData | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const router = useRouter();
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status: chatStatus,
    error,
    data,
  } = useChat({
    initialMessages,
    body: {
      chatId,
      isNewChat,
    },
    onError: async (error) => {
      console.error('Chat error:', error);
      
      // Clear previous errors
      setRateLimitError(null);
      setGeneralError(null);
      
      // Check if this is likely a rate limit error
      if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit')) {
        // For rate limit errors, we'll try to get more details
        // but fall back to a sensible default
        setRateLimitError({
          error: "Rate limit exceeded",
          message: "You have reached your daily request limit. Please try again tomorrow.",
          requestsToday: 1, // Current setting for testing
          dailyLimit: 1, // Current setting for testing
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      } else {
        setGeneralError(error.message);
      }
    },
    onResponse: async (response) => {
      // Handle rate limit responses with detailed error data
      if (response.status === 429) {
        try {
          const errorData = await response.clone().json();
          setRateLimitError(errorData);
        } catch (e) {
          console.error('Failed to parse rate limit error:', e);
          // Fallback already handled in onError
        }
      }
    },
  });

  // Handle new chat creation redirect
  useEffect(() => {
    const lastDataItem = data?.[data.length - 1];

    if (lastDataItem && isNewChatCreated(lastDataItem)) {
      router.push(`?id=${lastDataItem.chatId}`);
    }
  }, [data, router]);

  // Clear errors when user starts typing
  const handleInputChangeWithErrorClear = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (rateLimitError || generalError) {
      setRateLimitError(null);
      setGeneralError(null);
    }
    handleInputChange(e);
  };

  // Show sign-in modal if user is not authenticated
  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-semibold text-gray-200">
            Sign in required
          </h2>
          <p className="mb-6 text-gray-400">
            Please sign in to start chatting.
          </p>
          <button
            type="button"
            onClick={() => setShowSignInModal(true)}
            className="rounded bg-[#5865F2] px-6 py-3 text-white hover:bg-[#4752C4] focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Sign in with Discord
          </button>
        </div>
        <SignInModal 
          isOpen={showSignInModal} 
          onClose={() => setShowSignInModal(false)} 
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col">
        <StickToBottom
          className="mx-auto w-full max-w-[65ch] flex-1 relative overflow-y-auto [&>div]:scrollbar-thin [&>div]:scrollbar-track-gray-800 [&>div]:scrollbar-thumb-gray-600 hover:[&>div]:scrollbar-thumb-gray-500"
          resize="smooth"
          initial="smooth"
          role="log"
          aria-label="Chat messages"
        >
          <StickToBottom.Content className="flex flex-col gap-4 p-4">
            {messages.map((message, index) => {
              return (
                <ChatMessage
                  key={message.id ?? index}
                  message={message}
                  userName={userName}
                />
              );
            })}
            
            {/* Show rate limit error */}
            {rateLimitError && (
              <div className="mt-4">
                <RateLimitError 
                  message={rateLimitError.message}
                  requestsToday={rateLimitError.requestsToday}
                  dailyLimit={rateLimitError.dailyLimit}
                  resetTime={rateLimitError.resetTime}
                />
              </div>
            )}
            
            {/* Show general errors */}
            {(generalError || (!rateLimitError && error)) && (
              <div className="mt-4">
                <ErrorMessage message={generalError || error?.message || 'An error occurred'} />
              </div>
            )}
          </StickToBottom.Content>
        </StickToBottom>

        <div className="border-t border-gray-700">
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-[65ch] p-4"
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={handleInputChangeWithErrorClear}
                placeholder="Say something..."
                aria-label="Chat input"
                className="flex-1 rounded border border-gray-700 bg-gray-800 p-2 text-gray-200 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                disabled={chatStatus !== 'ready'}
              />
              <button
                type="submit"
                disabled={chatStatus !== 'ready' || !input.trim()}
                className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:hover:bg-gray-700 flex items-center justify-center"
              >
                {chatStatus !== 'ready' ? <Loader2 className="size-4 animate-spin" /> : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
