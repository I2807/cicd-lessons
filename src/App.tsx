import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ChatPanel } from "./components/ChatPanel";
import { unavailableChatService } from "./services/chatService";
import {
  UNAVAILABLE_RESPONSE,
  type ChatMessage,
  type ChatService,
} from "./types/chat";

interface AppProps {
  chatService?: ChatService;
}

function createMessage(
  role: ChatMessage["role"],
  content: string,
  sequence: number,
  generation: number,
): ChatMessage {
  return {
    id: `${role}-${generation}-${sequence}-${Date.now()}`,
    role,
    content,
    sequence,
    generation,
  };
}

export function App({ chatService = unavailableChatService }: AppProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [generation, setGeneration] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [hasError, setHasError] = useState(false);
  const generationRef = useRef(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isPending) {
      return;
    }

    const requestGeneration = generationRef.current;
    const history = messages.map(({ role, content }) => ({ role, content }));
    const userMessage = createMessage(
      "user",
      trimmedQuestion,
      messages.length,
      requestGeneration,
    );

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setQuestion("");
    setIsPending(true);
    setHasError(false);

    try {
      const response = await chatService.sendMessage({
        question: trimmedQuestion,
        history,
        generation: requestGeneration,
      });

      if (generationRef.current !== requestGeneration) {
        return;
      }

      const assistantMessage = createMessage(
        "assistant",
        response.trim(),
        messages.length + 1,
        requestGeneration,
      );
      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
      setIsPending(false);
    } catch {
      if (generationRef.current !== requestGeneration) {
        return;
      }

      const unavailableMessage = createMessage(
        "assistant",
        UNAVAILABLE_RESPONSE,
        messages.length + 1,
        requestGeneration,
      );
      setMessages((currentMessages) => [...currentMessages, unavailableMessage]);
      setIsPending(false);
      setHasError(true);
    }
  }

  function handleNewChat() {
    generationRef.current += 1;
    setGeneration(generationRef.current);
    setMessages([]);
    setQuestion("");
    setIsPending(false);
    setHasError(false);
  }

  return (
    <div className="app-shell" data-generation={generation}>
      <div className="app-frame">
        <header className="app-header">
          <div>
            <p className="eyebrow">Everyday tax clarity</p>
            <h1>CA Buddy</h1>
          </div>
          <p className="header-note">A calm first stop for small-business questions.</p>
        </header>
        <ChatPanel
          messages={messages}
          question={question}
          isPending={isPending}
          hasError={hasError}
          onQuestionChange={setQuestion}
          onSubmit={handleSubmit}
          onNewChat={handleNewChat}
        />
      </div>
    </div>
  );
}
