import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ChatMessage({
  role,
  title,
  children,
  className,
  content,
}: {
  role: "assistant" | "user";
  title?: string;
  children?: React.ReactNode;
  className?: string;
  content?: string;
}) {
  const isAssistant = role === "assistant";
  return (
    <div className={cn("flex items-start gap-3", !isAssistant && "flex-row-reverse text-right", className)}>
      <Avatar
        className={cn(
          "mt-1 h-8 w-8 text-xs font-semibold flex items-center justify-center rounded-full border",
          isAssistant 
            ? "dsg-bubble-ai text-[--dsg-gold]" 
            : "dsg-bubble-user text-[--dsg-accent]"
        )}
      >
        {isAssistant ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
  <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z" clipRule="evenodd" />
</svg>
 : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
</svg>
}
      </Avatar>
      <div className={cn("flex-1", !isAssistant && "flex flex-col items-end")}>
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl p-4 text-[--dsg-text] border",
            isAssistant ? "dsg-bubble-ai" : "dsg-bubble-user"
          )}
        >
          <div className="relative z-[1] space-y-2">
            {title ? (
              <div className={cn("text-sm font-semibold", !isAssistant && "text-right")}
              >
                <span>{title}</span>
              </div>
            ) : null}
            <div className="text-sm leading-relaxed text-[--text-dim] text-left prose prose-invert prose-sm max-w-none">
              {content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Customize markdown rendering
                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-[--text-dim]">{children}</li>,
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-2 text-[--text]">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-bold mb-2 text-[--text]">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-[--text]">{children}</h3>,
                    code: ({ inline, children, ...props }: any) => 
                      inline ? (
                        <code className="bg-[--bg] px-1.5 py-0.5 rounded text-[--accent] font-mono text-xs" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className="block bg-[--bg] p-3 rounded-lg overflow-x-auto font-mono text-xs mb-3" {...props}>
                          {children}
                        </code>
                      ),
                    pre: ({ children }) => <pre className="mb-3 overflow-x-auto">{children}</pre>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[--accent] pl-4 italic mb-3 text-[--text-dim]">
                        {children}
                      </blockquote>
                    ),
                    a: ({ children, href }) => (
                      <a href={href} className="text-[#8b5cf6] hover:text-[#a78bfa] underline font-medium transition-colors" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => <strong className="font-semibold text-[--text]">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                  }}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                children
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
