import { NextRequest, NextResponse } from 'next/server';
import { type StartGameRequest, type StartGameResponse, GameMessage, PRESET_SCENES, getAvatarTypeLabel, getAvatarVoiceId, getVoiceParams } from '@/lib/game-types';

async function callCozeChat(messages: { role: string; content: string }[], apiKey: string, baseUrl: string, botId: string) {
  const additionalMessages = messages.map(m => ({
    role: m.role,
    content: m.content,
    content_type: 'text' as const,
  }));

  const response = await fetch(`${baseUrl}/v3/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      bot_id: botId,
      user_id: `user-${Date.now()}`,
      stream: false,
      auto_save_history: true,
      additional_messages: additionalMessages,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Coze API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  
  if (data.code !== 0) {
    throw new Error(`Coze API error: ${data.code} - ${data.msg}`);
  }

  const chatId = data.data?.id;
  const conversationId = data.data?.conversation_id;

  if (!chatId || !conversationId) {
    throw new Error('Coze API response missing chat_id or conversation_id');
  }

  let status = data.data?.status;

  while (status === 'in_progress') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pollResponse = await fetch(`${baseUrl}/v3/chat/retrieve?conversation_id=${conversationId}&chat_id=${chatId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    const pollData = await pollResponse.json();
    status = pollData.data?.status;
  }

  const messagesResponse = await fetch(`${baseUrl}/v3/chat/message/list?conversation_id=${conversationId}&chat_id=${chatId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!messagesResponse.ok) {
    throw new Error(`Coze messages error: ${messagesResponse.status}`);
  }

  const messagesData = await messagesResponse.json();
  const assistantMessages = messagesData.data?.filter((m: { role: string; content: string }) => 
    m.role === 'assistant' && 
    m.content && 
    !m.content.startsWith('{"msg_type":"generate_answer_finish') &&
    !m.content.startsWith('在这个场景中') &&
    !m.content.startsWith('再提供') &&
    !m.content.startsWith('推荐') &&
    !m.content.startsWith('换一个')
  ) || [];
  
  if (assistantMessages.length === 0) {
    throw new Error('No assistant message found');
  }

  return assistantMessages[0].content;
}

async function callCozeTTS(text: string, speakerId: string, speechRate: number, loudnessRate: number, apiKey: string, baseUrl: string) {
  const response = await fetch(`${baseUrl}/api/v1/tts/synthesize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      speaker: speakerId,
      audio_format: 'mp3',
      speech_rate: speechRate,
      loudness_rate: loudnessRate,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`TTS API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.data?.audio_url || data.data?.audio_uri || '';
}

export async function POST(request: NextRequest) {
  try {
    const body: StartGameRequest = await request.json();
    const { gender, partnerName, avatarType, sceneId, difficulty } = body;

    if (!gender || !partnerName || !avatarType || !sceneId || !difficulty) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 });
    }

    const presetScene = PRESET_SCENES.find((s) => s.id === sceneId);
    if (!presetScene) {
      return NextResponse.json({ error: '场景不存在' }, { status: 400 });
    }

    const apiKey = process.env.COZE_WORKLOAD_IDENTITY_API_KEY;
    const baseUrl = process.env.COZE_INTEGRATION_BASE_URL || 'https://api.coze.cn';
    const botId = process.env.COZE_BOT_ID;

    if (!apiKey) {
      return NextResponse.json({ error: 'API密钥未配置' }, { status: 500 });
    }

    if (!botId) {
      return NextResponse.json({ error: '智能体ID未配置(COZE_BOT_ID)' }, { status: 500 });
    }

    const sceneMessages = [
      {
        role: 'user',
        content: `请生成一个详细的恋爱吵架场景描述。

基础场景：${presetScene.desc}
恋爱对象：${partnerName}（${getAvatarTypeLabel(avatarType, gender)}）
对方性别：${gender === 'female' ? '女' : '男'}
难度：${difficulty === 'easy' ? '简单' : difficulty === 'normal' ? '普通' : '地狱'}

生成要求：
1. 场景必须是日常生活中真实可能发生的
2. 包含：具体时间、地点、发生了什么细节、对方的情绪状态
3. 语气有代入感，像在讲述一个故事
4. 只描述客观事实和背景，不要给出任何建议、提示或"应该怎么做"的引导
5. 字数150-250字

OUTPUT FORMAT (JSON ONLY):
{"scene": "场景描述文字"}`,
      },
    ];

    const sceneResponse = await callCozeChat(sceneMessages, apiKey, baseUrl, botId);

    let scene = '';
    try {
      let text = sceneResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      if (!text.startsWith('{')) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          text = jsonMatch[0];
        }
      }
      const parsed = JSON.parse(text);
      scene = parsed.scene || '';
    } catch {
      scene = sceneResponse;
    }

    if (!scene) {
      scene = presetScene.desc;
    }

    const chatMessages = [
      {
        role: 'user',
        content: `现在开始角色扮演游戏。你扮演${partnerName}，一个正在生气的${gender === 'female' ? '女友' : '男友'}。

当前场景：${scene}
当前情绪：暴怒（愤怒值100/100）

回复规则：
1. 必须用暴怒的语气质问对方，像真人吵架一样
2. 只说你口头说的话，不要动作描写、心理描写、场景描写
3. 要有活人感，可以有口头禅、重复、反问等

选项生成规则：
1. 生成4个选项供对方回应（都是用户的口吻）
2. 1个高情商选项、1个还行选项、1个中性选项、1个踩雷选项
3. 选项必须是纯口头回复，不要动作描述、表情符号

OUTPUT FORMAT (JSON ONLY):
{"partnerMessage":"你说的话","options":["选项1","选项2","选项3","选项4"]}`,
      },
    ];

    const chatResponse = await callCozeChat(chatMessages, apiKey, baseUrl, botId);

    let partnerMessage = '';
    let options: string[] = [];

    try {
      let text = chatResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      if (!text.startsWith('{')) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          text = jsonMatch[0];
        }
      }
      const parsed = JSON.parse(text);
      partnerMessage = parsed.partnerMessage || '';
      options = Array.isArray(parsed.options) ? parsed.options : [];
    } catch {
      const rawText = chatResponse;
      const msgMatch = rawText.match(/"partnerMessage"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      partnerMessage = msgMatch ? msgMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\') : rawText;
      const optionsMatch = rawText.match(/"options"\s*:\s*\[([\s\S]*?)\]/);
      if (optionsMatch) {
        try {
          options = JSON.parse(`[${optionsMatch[1]}]`);
        } catch {
          options = [];
        }
      }
    }

    if (!options || options.length === 0) {
      const genderLabel = gender === 'male' ? '他' : '她';
      options = [
        `对不起${partnerName}，我真的知道错了`,
        `${genderLabel}现在肯定很委屈，让我好好安慰一下`,
        `我保证以后不会再这样了`,
        `我给你买好吃的，你别生气了好不好？`,
      ];
    }

    const initialMessage: GameMessage = {
      role: 'partner',
      content: partnerMessage,
      options,
    };

    let audioUrl: string | undefined;
    if (partnerMessage) {
      try {
        const speakerId = getAvatarVoiceId(avatarType, gender);
        const voiceParams = getVoiceParams('furious');
        audioUrl = await callCozeTTS(
          partnerMessage,
          speakerId,
          voiceParams.speechRate,
          voiceParams.loudnessRate,
          apiKey,
          baseUrl
        );
        initialMessage.audioUrl = audioUrl;
      } catch (error) {
        console.error('Start TTS error:', error);
      }
    }

    const result: StartGameResponse = {
      scene,
      initialMessage,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Start game error:', error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: '游戏初始化失败，请重试', detail }, { status: 500 });
  }
}