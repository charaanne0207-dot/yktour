import "server-only";
import { serverEnv } from "@/lib/config/env";

// Claude API 서비스 (서버 전용). 사실 정보(시간·가격·주소) 생성에는 사용하지 않는다 — PRD §5.3

export class LlmNotConfiguredError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY 가 설정되지 않았습니다.");
  }
}

export async function completeText(system: string, user: string, maxTokens = 600): Promise<string> {
  const { anthropicKey, anthropicModel } = serverEnv();
  if (!anthropicKey) throw new LlmNotConfiguredError();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: anthropicModel,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}`);
  const data = await res.json();
  return (data.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");
}
