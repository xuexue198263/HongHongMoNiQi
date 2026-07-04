import { NextRequest, NextResponse } from 'next/server';
import { AVATAR_TYPES, AvatarType, getAvatarTypeLabel, type GenerateAvatarsRequest, type GenerateAvatarsResponse } from '@/lib/game-types';

// 固定头像映射表，图片存放在 public/avatars/ 目录
const FIXED_AVATARS: Record<string, Record<AvatarType, string>> = {
  female: {
    gentle: '/avatars/female_gentle.jpeg',
    lively: '/avatars/female_lively.jpeg',
    cool: '/avatars/female_cool.jpeg',
    friendly: '/avatars/female_approachable.jpeg',
  },
  male: {
    gentle: '/avatars/male_gentle.jpeg',
    lively: '/avatars/male_lively.jpeg',
    cool: '/avatars/male_cool.jpeg',
    friendly: '/avatars/male_approachable.jpeg',
  },
};

export async function POST(request: NextRequest) {
  try {
    const body: GenerateAvatarsRequest = await request.json();
    const { gender } = body;

    if (!gender || !['male', 'female'].includes(gender)) {
      return NextResponse.json({ error: '请选择性别' }, { status: 400 });
    }

    const avatarTypes: AvatarType[] = ['gentle', 'lively', 'cool', 'friendly'];
    const fixedPaths = FIXED_AVATARS[gender];

    const avatars: GenerateAvatarsResponse['avatars'] = avatarTypes.map((type) => ({
      type,
      label: getAvatarTypeLabel(type, gender),
      url: fixedPaths[type],
    }));

    return NextResponse.json({ avatars });
  } catch (error) {
    console.error('Get avatars error:', error);
    return NextResponse.json({ error: '获取头像失败，请重试' }, { status: 500 });
  }
}
