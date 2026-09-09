import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { createGeminiChatService } from "./services/geminiChatService";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("CA Buddy root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App chatService={createGeminiChatService()} />
  </StrictMode>,
);
