import type { APIRoute } from "astro";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: import.meta.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const { messages } = await request.json();

    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `你是 yRlwAaa 网站的 AI 助手。网站信息：
- 站长：yRlwAaa
- 主题：二次元、音乐、日常
- 内容：日记、相册、追番、音乐下载

回答要友好、简洁。`
        },
        ...messages
      ],
      stream: true,
    });

    // 流式响应
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "请求失败" }), {
      status: 500,
    });
  }
};