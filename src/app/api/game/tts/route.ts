import { NextRequest, NextResponse } from 'next/server';
import { type TTSRequest, type TTSResponse, AVATAR_TYPES, getVoiceParams, type AngerLevel } from '@/lib/game-types';

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json();
    const { text, avatarType, gender, angerLevel } = body;

    if (!text || !avatarType || !gender) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const apiKey = process.env.COZE_WORKLOAD_IDENTITY_API_KEY;
    const baseUrl = process.env.COZE_INTEGRATION_BASE_URL || 'https://api.coze.cn';

    if (!apiKey) {
      return NextResponse.json({ error: 'API密钥未配置' }, { status: 500 });
    }

    const avatarInfo = AVATAR_TYPES[avatarType];
    const speakerId = gender === 'female' ? avatarInfo.femaleVoiceId : avatarInfo.maleVoiceId;
    const resolvedAngerLevel: AngerLevel = angerLevel || 'annoyed';
    const voiceParams = getVoiceParams(resolvedAngerLevel);

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
        speech_rate: voiceParams.speechRate,
        loudness_rate: voiceParams.loudnessRate,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`TTS API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const audioUrl = data.data?.audio_url || data.data?.audio_uri || '';

    const result: TTSResponse = {
      audioUrl,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: '语音生成失败', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
