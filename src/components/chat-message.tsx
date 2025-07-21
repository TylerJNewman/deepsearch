import ReactMarkdown, { type Components } from "react-markdown";
import type { Message } from "ai";

// Extract MessagePart type from Message
export type MessagePart = NonNullable<Message["parts"]>[number];

interface ChatMessageProps {
  message: Message;
  userName: string;
}

const components: Components = {
  // Override default elements with custom styling
  p: ({ children }) => <p className="mb-4 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal pl-4">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  code: ({ className, children, ...props }) => (
    <code className={`${className ?? ""}`} {...props}>
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-700 p-4">
      {children}
    </pre>
  ),
  a: ({ children, ...props }) => (
    <a
      className="text-blue-400 underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};

const Markdown = ({ children }: { children: string }) => {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
};

const ToolInvocationPart = ({ part }: { part: MessagePart & { type: "tool-invocation" } }) => {
  const { toolInvocation } = part;
  
  if (toolInvocation.state === "partial-call") {
    return (
      <div className="mb-4 rounded-lg border border-gray-600 bg-gray-700 p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="size-2 animate-pulse rounded-full bg-yellow-400" />
          <span className="text-sm font-medium text-gray-300">
            Calling {toolInvocation.toolName}...
          </span>
        </div>
      </div>
    );
  }

  if (toolInvocation.state === "call") {
    return (
      <div className="mb-4 rounded-lg border border-gray-600 bg-gray-700 p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="size-2 rounded-full bg-blue-400" />
          <span className="text-sm font-medium text-gray-300">
            {toolInvocation.toolName}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(toolInvocation.args, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  if (toolInvocation.state === "result") {
    return (
      <div className="mb-4 rounded-lg border border-gray-600 bg-gray-700 p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="size-2 rounded-full bg-green-400" />
          <span className="text-sm font-medium text-gray-300">
            {toolInvocation.toolName} completed
          </span>
        </div>
        <div className="text-xs text-gray-400">
          <details className="cursor-pointer">
            <summary className="hover:text-gray-300">View search results</summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify(toolInvocation.result, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  return null;
};

const TextPart = ({ part }: { part: MessagePart & { type: "text" } }) => {
  return <Markdown>{part.text}</Markdown>;
};

const StepStartPart = ({ part }: { part: MessagePart & { type: "step-start" } }) => {
  // Don't render anything for step-start parts to avoid clutter
  return null;
};

const MessagePartRenderer = ({ part }: { part: MessagePart }) => {
  switch (part.type) {
    case "text":
      return <TextPart part={part} />;
    case "tool-invocation":
      return <ToolInvocationPart part={part} />;
    case "step-start":
      return <StepStartPart part={part} />;
    default:
      // For any unhandled part types, just render a placeholder
      return (
        <div className="mb-2 rounded-lg border border-gray-600 bg-gray-700 p-2 text-xs text-gray-400">
          Unsupported part type: {"type" in part ? String(part.type) : "unknown"}
        </div>
      );
  }
};

export const ChatMessage = ({ message, userName }: ChatMessageProps) => {
  const isAI = message.role === "assistant";
  
  // Use parts if available, fallback to content for backwards compatibility
  const parts = message.parts || (message.content ? [{ type: "text" as const, text: message.content }] : []);

  return (
    <div className="mb-6">
      <div
        className={`rounded-lg p-4 ${
          isAI ? "bg-gray-800 text-gray-300" : "bg-gray-900 text-gray-300"
        }`}
      >
        <p className="mb-2 text-sm font-semibold text-gray-400">
          {isAI ? "AI" : userName}
        </p>

        <div className="prose prose-invert max-w-none">
          {parts.map((part, index) => (
            <MessagePartRenderer key={`${part.type}-${index}`} part={part} />
          ))}
        </div>
      </div>
    </div>
  );
};
