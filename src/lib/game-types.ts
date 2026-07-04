// ========== 常量定义 ==========

export const DIFFICULTY_LEVELS = [
  { id: 'easy' as Difficulty, label: '简单', desc: '选项差异明显，容易分辨', emoji: '😊' },
  { id: 'normal' as Difficulty, label: '普通', desc: '需要思考才能选对', emoji: '😏' },
  { id: 'hard' as Difficulty, label: '地狱', desc: '选项几乎一样，措辞决定成败', emoji: '😈' },
];

export type Difficulty = 'easy' | 'normal' | 'hard';

export const AVATAR_TYPES: Record<AvatarType, {
  femaleLabel: string;
  maleLabel: string;
  femaleVoiceId: string;
  maleVoiceId: string;
}> = {
  gentle: {
    femaleLabel: '温柔知性型',
    maleLabel: '温文尔雅型',
    femaleVoiceId: 'zh_female_meilinvyou_saturn_bigtts',
    maleVoiceId: 'zh_male_ruyayichen_saturn_bigtts',
  },
  lively: {
    femaleLabel: '活泼可爱型',
    maleLabel: '阳光开朗型',
    femaleVoiceId: 'saturn_zh_female_keainvsheng_tob',
    maleVoiceId: 'saturn_zh_male_shuanglangshaonian_tob',
  },
  cool: {
    femaleLabel: '高冷御姐型',
    maleLabel: '高冷型男型',
    femaleVoiceId: 'zh_female_mizai_saturn_bigtts',
    maleVoiceId: 'zh_male_m191_uranus_bigtts',
  },
  friendly: {
    femaleLabel: '邻家亲和型',
    maleLabel: '暖男亲和型',
    femaleVoiceId: 'zh_female_xiaohe_uranus_bigtts',
    maleVoiceId: 'zh_male_taocheng_uranus_bigtts',
  },
};

export function getAvatarTypeLabel(type: AvatarType, gender: string): string {
  const info = AVATAR_TYPES[type];
  return gender === 'male' ? info.maleLabel : info.femaleLabel;
}

export function getAvatarVoiceId(type: AvatarType, gender: string): string {
  const info = AVATAR_TYPES[type];
  return gender === 'male' ? info.maleVoiceId : info.femaleVoiceId;
}

export const AVATAR_IMAGE_MAP: Record<string, string> = {
  'female_gentle': '/avatars/female_gentle.jpeg',
  'female_lively': '/avatars/female_lively.jpeg',
  'female_cool': '/avatars/female_cool.jpeg',
  'female_friendly': '/avatars/female_approachable.jpeg',
  'male_gentle': '/avatars/male_gentle.jpeg',
  'male_lively': '/avatars/male_lively.jpeg',
  'male_cool': '/avatars/male_cool.jpeg',
  'male_friendly': '/avatars/male_approachable.jpeg',
};

export const PRESET_SCENES = [
  { id: 'anniversary', name: '忘了纪念日', desc: '你完全忘记了两人的恋爱纪念日，对方精心准备了一整天，等来的却只有沉默' },
  { id: 'birthday', name: '忘了生日', desc: '今天是对方的生日，你不但没准备礼物，还跟朋友出去玩了' },
  { id: 'late', name: '约会迟到', desc: '约好了一起看电影，你迟到了一个小时，对方在电影院门口等了很久' },
  { id: 'misunderstanding', name: '异性误会', desc: '对方看到你和一名异性在一起说说笑笑，虽然只是正常工作交流，但看起来很亲密' },
  { id: 'privacy', name: '手机隐私', desc: '对方无意间看到你手机里和别人的聊天记录，虽然没什么但你的态度很闪躲' },
  { id: 'compare', name: '拿别人比较', desc: '你在聊天中不经意地拿对方和别人的对象做比较，说出了让对方很不舒服的话' },
  { id: 'read_noreply', name: '消息已读不回', desc: '对方发了一大段心里话给你，你已读了但过了很久都没有回复' },
  { id: 'ex', name: '前任相关', desc: '对方发现你还保留着前任的东西，或者在某件事上提到了前任' },
  { id: 'promise', name: '食言而肥', desc: '你之前郑重承诺过的事情，再次没有做到，这已经不是第一次了' },
  { id: 'family', name: '家庭聚会上失言', desc: '在对方家人的聚会上，你说了不合时宜的话，让对方在家人面前很没面子' },
];

// ========== 类型定义 ==========

export type AvatarType = 'gentle' | 'lively' | 'cool' | 'friendly';

export type GameStatus = 'playing' | 'won' | 'lost' | 'exploded' | 'violated' | 'lost_over_100' | 'lost_rounds' | 'lost_illegal';

export interface Message {
  role: 'partner' | 'system' | 'rescue';
  content: string;
  options?: string[];
  audioUrl?: string;
  angerChange?: number;
}

/** @deprecated Use Message instead */
export type GameMessage = Message;

export interface GameState {
  gender: string;
  partnerName: string;
  avatarType: AvatarType;
  avatarUrl: string;
  scene: string;
  sceneId: string;
  difficulty: Difficulty;
  angerValue: number;
  round: number;
  maxRounds: number;
  usedRescue: boolean;
  messages: Message[];
  status: GameStatus;
  closingMessage?: string;
}

export interface StartGameRequest {
  gender: string;
  partnerName: string;
  avatarType: AvatarType;
  avatarUrl: string;
  sceneId: string;
  difficulty: Difficulty;
}

export interface StartGameResponse {
  scene: string;
  initialMessage: Message;
}

export interface ChatRequest {
  gameState: GameState;
  userChoice: string;
  isCustomInput: boolean;
}

export interface ChatResponse {
  partnerMessage: Message;
  angerChange: number;
  newAngerValue: number;
  gameOver: boolean;
  gameStatus: GameStatus;
  usedRescue?: boolean;
  closingMessage?: string;
}

export interface GenerateAvatarsRequest {
  gender: string;
}

export interface GenerateAvatarsResponse {
  avatars: { type: AvatarType; label: string; url: string }[];
}

export interface TTSRequest {
  text: string;
  angerLevel: AngerLevel;
  gender: string;
  avatarType: AvatarType;
}

export interface TTSResponse {
  audioUrl: string;
}

export interface ResultData {
  status: GameStatus;
  partnerName: string;
  gender: string;
  avatarType: AvatarType;
  avatarUrl: string;
  sceneId: string;
  difficulty: Difficulty;
  angerValue: number;
  round: number;
  usedRescue: boolean;
  closingMessage?: string;
}

// ========== 愤怒等级与语音参数 ==========

export type AngerLevel = 'furious' | 'annoyed' | 'softening' | 'forgiving';

export const ANGER_LEVEL_CONFIG: Record<AngerLevel, { label: string; description: string }> = {
  furious: { label: '暴怒', description: '语气激烈、尖锐' },
  annoyed: { label: '不爽但松动', description: '语气生硬但偶有软化' },
  softening: { label: '心软嘴硬', description: '嘴上不饶人但明显在给机会' },
  forgiving: { label: '原谅', description: '语气温柔、带着释然' },
};

export function getAngerLevel(value: number): AngerLevel {
  if (value > 70) return 'furious';
  if (value > 40) return 'annoyed';
  if (value > 10) return 'softening';
  return 'forgiving';
}

export function getVoiceParams(angerLevel: AngerLevel): { speechRate: number; loudnessRate: number } {
  switch (angerLevel) {
    case 'furious':
      return { speechRate: 25, loudnessRate: 40 };
    case 'annoyed':
      return { speechRate: 10, loudnessRate: 20 };
    case 'softening':
      return { speechRate: -5, loudnessRate: -5 };
    case 'forgiving':
      return { speechRate: -15, loudnessRate: -15 };
  }
}

// ========== 愤怒值工具 ==========

export function getAngerConfig(value: number): { label: string; color: string; emoji: string } {
  if (value > 70) return { label: '暴怒', color: '#FF4757', emoji: '🤬' };
  if (value > 40) return { label: '不爽', color: '#FF6348', emoji: '😤' };
  if (value > 10) return { label: '心软', color: '#FFA502', emoji: '😣' };
  return { label: '原谅', color: '#2ED573', emoji: '😊' };
}

export function getRatingLevel(round: number, usedRescue: boolean): { title: string; emoji: string; color: string; description: string } {
  if (usedRescue) return { title: '死里逃生', emoji: '💀', color: '#9B59B6', description: '靠兜底机制才勉强过关' };
  if (round <= 3) return { title: '哄人天花板', emoji: '🏆', color: '#FFD700', description: '只用了3轮就哄好了对方' };
  if (round <= 6) return { title: '情商在线', emoji: '✨', color: '#2ED573', description: '表现不错，情商过关' };
  return { title: '险过及格线', emoji: '😅', color: '#FFA502', description: '虽然过程曲折但最终成功' };
}
