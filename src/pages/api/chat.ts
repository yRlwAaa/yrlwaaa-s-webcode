import type { APIRoute } from "astro";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-5c93e170487045369f4a82e0fb6188cb",
  baseURL: "https://api.deepseek.com",
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // 直接用 json() 方法
    const body = await request.json();
    console.log("解析成功:", body);
    
    const { messages } = body;

    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `你是 yRlwAaa 网站的 AI 助手。网站信息：
- 站长：yRlwAaa
- 主题：二次元、音乐、日常
- 内容：日记、相册、追番、音乐下载

回答要友好、简洁，用中文。`
        },
        ...messages
      ],
      stream: true,
    });

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
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "请求失败", detail: String(error) }), {
      status: 500,
    });
  }
};