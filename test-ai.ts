async function testCozeLLM() {
  const apiKey = 'pat_u5vZGKKuv7WiaO8xbUj78dpA51xwgrdZvIRVTq13aKKYdqJf206qpVtsa8uoGIaM';
  const baseUrl = 'https://api.coze.cn';

  console.log('Testing Coze LLM API (OpenAI compatible)...');
  
  try {
    const response = await fetch(`${baseUrl}/v3/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'doubao-seed-2-0-pro-260215',
        messages: [
          { role: 'system', content: '你是一个聊天机器人' },
          { role: 'user', content: '你好' },
        ],
        temperature: 0.9,
        max_tokens: 100,
      }),
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testCozeLLM();
