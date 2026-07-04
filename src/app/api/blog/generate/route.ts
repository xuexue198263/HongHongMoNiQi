import { NextRequest, NextResponse } from 'next/server';
import { getDb, blogPosts } from '@/storage/database/pg-client';

const GENERATE_PROMPT = `你是一个恋爱沟通技巧专家，擅长用轻松幽默的方式分享恋爱相处之道。

请生成一篇关于恋爱沟通技巧的文章，要求：
1. 主题要贴近年轻人的恋爱生活，比如吵架后的处理、道歉技巧、倾听的艺术、如何表达爱意等
2. 文章风格轻松幽默，像朋友聊天一样，可以适当用一些网络流行梗
3. 字数控制在300-500字
4. 必须有标题、摘要（30字以内）和正文

请直接输出JSON格式：
{
  "title": "文章标题",
  "summary": "文章摘要，30字以内",
  "content": "文章正文内容"
}`;

async function callCozeLLM(messages: { role: string; content: string }[], model: string, apiKey: string, baseUrl: string) {
  const response = await fetch(`${baseUrl}/v3/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.9,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Coze API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  return content;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.COZE_WORKLOAD_IDENTITY_API_KEY;
  const baseUrl = process.env.COZE_INTEGRATION_BASE_URL || 'https://api.coze.cn';

  if (!apiKey) {
    return NextResponse.json({ error: 'API密钥未配置' }, { status: 500 });
  }

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: GENERATE_PROMPT },
    { role: 'user', content: '请生成一篇恋爱沟通技巧文章' }
  ];

  try {
    const response = await callCozeLLM(messages, 'doubao-seed-2-0-lite-260215', apiKey, baseUrl);

    let cleanText = response;
    cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      const jsonMatch = cleanText.match(/\{[\s\S]*"title"[\s\S]*"summary"[\s\S]*"content"[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        console.error('LLM返回格式无法解析:', cleanText);
        return NextResponse.json({ error: '生成文章格式错误' }, { status: 500 });
      }
    }

    const { title, summary, content } = parsed;

    if (!title || !summary || !content) {
      return NextResponse.json({ error: '生成文章缺少必要字段' }, { status: 500 });
    }

    const db = getDb();
    
    let savedPost = null;
    if (db) {
      const result = await db
        .insert(blogPosts)
        .values({ title, summary, content })
        .returning({ id: blogPosts.id, title: blogPosts.title, summary: blogPosts.summary, created_at: blogPosts.created_at });

      if (result && result.length > 0) {
        savedPost = result[0];
      }
    }

    return NextResponse.json({
      success: true,
      post: savedPost || { title, summary, created_at: new Date().toISOString() },
      message: savedPost ? '文章生成成功' : '文章生成成功（未保存到数据库）'
    });
  } catch (error) {
    console.error('生成文章失败:', error);
    return NextResponse.json({ error: '生成文章失败' }, { status: 500 });
  }
}
