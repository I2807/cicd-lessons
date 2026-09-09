import type { FormEvent, KeyboardEvent } from "react";
import type { ChatMessage } from "../types/chat";

interface ChatPanelProps {
  messages: ChatMessage[];
  question: string;
  isPending: boolean;
  hasError: boolean;
  onQuestionChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onNewChat: () => void;
}

export function ChatPanel({
  messages,
  question,
  isPending,
  hasError,
  onQuestionChange,
  onSubmit,
  onNewChat,
}: ChatPanelProps) {
  function handleQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <section className="chat-panel" aria-label="Chat conversation" role="log" aria-live="polite">
      <div className="chat-panel__topline">
        <div>
          <p className="section-kicker">Current conversation</p>
          <h2>Ask with context. Move with clarity.</h2>
        </div>
        <button className="new-chat-button" type="button" onClick={onNewChat}>
          <span aria-hidden="true">+</span>
          New chat
        </button>
      </div>

      <div className="conversation-scroll">
        {messages.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__mark" aria-hidden="true">
              CA
            </span>
            <p>Your questions and practical answers will appear here.</p>
          </div>
        ) : (
          <ol className="message-list" aria-label="Conversation messages">
            {messages.map((message) => (
              <li key={message.id} className={`message-row message-row--${message.role}`}>
                <article
                  className="message-bubble"
                  aria-label={
                    message.role === "assistant" ? "Assistant message" : "Your message"
                  }
                >
                  <p className="message-label">
                    {message.role === "assistant" ? "CA Buddy" : "You"}
                  </p>
                  <p className="message-content">{message.content}</p>
                </article>
              </li>
            ))}
          </ol>
        )}

        {isPending ? (
          <p className="pending-state" role="status">
            <span className="pending-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            CA Buddy is thinking...
          </p>
        ) : null}

        {hasError ? (
          <p className="error-state" role="alert">
            The response could not be verified. Please try again or start a new chat.
          </p>
        ) : null}
      </div>

      <form className="question-form" onSubmit={onSubmit}>
        <label className="question-label" htmlFor="question-input">
          Ask a tax question
        </label>
        <div className="question-controls">
          <textarea
            id="question-input"
            name="question"
            rows={2}
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            onKeyDown={handleQuestionKeyDown}
            placeholder="GST, TDS, ITR dates, or audit basics..."
            aria-describedby="disclaimer"
            disabled={isPending}
          />
          <button
            className="send-button"
            type="submit"
            disabled={isPending || question.trim().length === 0}
          >
            <span aria-hidden="true">&#8599;</span>
            Send question
          </button>
        </div>
        <p className="disclaimer" id="disclaimer">
          CA Buddy provides general information, not professional advice. Consult a Chartered
          Accountant for important or individualized decisions.
        </p>
      </form>
    </section>
  );
}
