'use client';

// —— keep your existing imports ——
import type { ChartConfig } from '@/components/ui/chart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { cn } from '@/lib/utils';
import { fetchApi } from '@/libs/api';
import { Env } from '@/libs/Env';
import { useAuthStore } from '@/store/authStore';
import { useMonitorColumnsStore } from '@/store/monitorColumnsStore';
import {
  CalendarIcon,
  ChevronDownIcon,
  MessageCircle,
  Quote,
  RefreshCw,
  Repeat2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceArea, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// —— demo data (replace with API data when wired) ——
// 图表数据现在通过 seriesData 动态计算，基于实际的推文数据

const chartConfig = {
  tweets: { label: 'Tweets', color: 'var(--chart-1)' },
  ip: { label: 'Interaction Points', color: 'var(--chart-2)' },
  first: { label: 'First Interactions', color: 'var(--chart-3)' },
} satisfies ChartConfig;

// —— data contracts —— //
export type InteractionItem = {
  id: string;
  type: 'reply' | 'retweet' | 'quote';
  userHandle: string;
  userName: string;
  avatar?: string;
  text?: string; // retweet 可为空
  createdAt: string; // ISO
};

export type Tweet = {
  id: string;
  authorHandle: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string; // ISO
  text: string;
  replies?: number;
  retweets?: number;
  quotes?: number; // 新增：quote tweets 计数
  likes?: number; // 保留以便 IP 计算
  firstInteraction?: boolean;
  interactions?: InteractionItem[]; // 展开显示用
};

export type Participant = {
  rank: number;
  handle: string; // without @
  displayName: string;
  avatar?: string;
  mentionShare: number; // e.g. 7.9 (% of total mentions)
  tweets: number; // total tweets captured
  firstMentionAt?: string; // ISO
  followers: number;
  influenceScore?: number; // 0–100
};

// —— demo lists ——
const DEMO_PARTICIPANTS: Participant[] = [
  { rank: 1, handle: 'PythNetwork', displayName: 'Pyth Network', mentionShare: 7.9, tweets: 129, followers: 1341, influenceScore: 82, avatar: 'https://unavatar.io/twitter/pythnetwork' },
  { rank: 2, handle: 'PionX', displayName: 'PionX', mentionShare: 3.3, tweets: 40, followers: 409, influenceScore: 61, avatar: 'https://unavatar.io/twitter/pionxprotocol' },
  { rank: 3, handle: 'InvestorDan', displayName: 'Investor Dan', mentionShare: 2.8, tweets: 33, followers: 302, influenceScore: 58, avatar: 'https://unavatar.io/twitter/investor0xdano' },
  { rank: 4, handle: 'PireTriment', displayName: 'PireTriment', mentionShare: 2.3, tweets: 24, followers: 144, influenceScore: 45 },
  { rank: 5, handle: 'Solana', displayName: 'Solana', mentionShare: 2.1, tweets: 18, followers: 3764, influenceScore: 90, avatar: 'https://unavatar.io/twitter/solana' },
];

// —— 生成最近10天内的推文数据 ——
const generateRecentTweets = (): Tweet[] => {
  const today = new Date();
  const tweets: Tweet[] = [];

  // 生成一些分布在最近10天内的推文
  const tweetTemplates = [
    { authorHandle: 'CryptoMenace', authorName: 'CryptoMenace', text: '$PYTH: oracle data feeds', replies: 0, retweets: 1, quotes: 2, likes: 0 },
    { authorHandle: 'MM_MoneyMan', authorName: 'MM', text: '$PYTH consolidation before higher', replies: 1, retweets: 2, quotes: 1, likes: 1 },
    { authorHandle: 'arthurbtc', authorName: 'ARTHUR', text: '@PythNetwork super cycle?', replies: 1, retweets: 0, quotes: 0, likes: 0 },
    { authorHandle: 'DeFiTrader', authorName: 'DeFi Trader', text: 'PYTH price action looking strong 📈', replies: 2, retweets: 0, quotes: 1, likes: 1 },
    { authorHandle: 'CryptoAnalyst', authorName: 'Crypto Analyst', text: 'Oracle networks are the backbone of DeFi', replies: 1, retweets: 2, quotes: 5, likes: 1 },
  ];

  tweetTemplates.forEach((template, index) => {
    // 随机分布在最近10天内
    const daysAgo = Math.floor(Math.random() * 10);
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);

    const createdAt = new Date(today);
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(createdAt.getHours() - hoursAgo);
    createdAt.setMinutes(createdAt.getMinutes() - minutesAgo);

    tweets.push({
      id: `t${index + 1}`,
      authorHandle: template.authorHandle,
      authorName: template.authorName,
      createdAt: createdAt.toISOString(),
      text: template.text,
      replies: template.replies,
      retweets: template.retweets,
      quotes: template.quotes,
      likes: template.likes,
      firstInteraction: Math.random() > 0.7, // 30% 概率是首次互动
      interactions: [
        { id: `i${index * 3 + 1}`, type: 'reply', userHandle: 'alice', userName: 'Alice', avatar: 'https://unavatar.io/twitter/alice', text: 'Agreed! 🧡', createdAt: new Date(createdAt.getTime() + 2 * 60 * 1000).toISOString() },
        { id: `i${index * 3 + 2}`, type: 'retweet', userHandle: 'bob', userName: 'Bob', avatar: 'https://unavatar.io/twitter/bob', createdAt: new Date(createdAt.getTime() + 5 * 60 * 1000).toISOString() },
        { id: `i${index * 3 + 3}`, type: 'quote', userHandle: 'cara', userName: 'Cara', avatar: 'https://unavatar.io/twitter/cara', text: 'Great summary 👇', createdAt: new Date(createdAt.getTime() + 7 * 60 * 1000).toISOString() },
      ],
    });
  });

  return tweets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const DEMO_TWEETS: Tweet[] = generateRecentTweets();

// —— small utilities ——
const numberCompact = (n: number) => new Intl.NumberFormat('en', { notation: 'compact' }).format(n);
const timeAgo = (iso: string) => {
  const delta = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(delta / 60000);
  if (mins < 1) {
    return 'now';
  }
  if (mins < 60) {
    return `${mins}m`;
  }
  const h = Math.floor(mins / 60);
  if (h < 24) {
    return `${h}h`;
  }
  const d = Math.floor(h / 24);
  return `${d}d`;
};

// interaction points = replies + 2*retweets + 3*likes
const ipScore = (t: Tweet) => (t.replies || 0) + 2 * (t.retweets || 0) + 3 * (t.likes || 0);

// —— sortable header cell ——
function SortableHeader({ children, active, dir }: { children: React.ReactNode; active?: boolean; dir?: 'asc' | 'desc' }) {
  return (
    <div className={cn('flex items-center gap-1 select-none cursor-pointer', active ? 'text-orange-400' : 'text-neutral-300')} aria-label="Sort column">
      <span>{children}</span>
      {active && <span className="text-xs">{dir === 'asc' ? '▲' : '▼'}</span>}
    </div>
  );
}

// —— ProfileSummary 内容（不带外壳 Card），用于 hover 浮层复用 ——
function ProfileSummaryBody({ user }: { user: Participant | null }) {
  if (!user) {
    return <div className="text-sm text-neutral-400">Select a user from the leaderboard to see profile details and interaction metrics.</div>;
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.displayName.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="text-neutral-100">{user.displayName}</div>
          <div className="text-xs text-neutral-400">
            @
            {user.handle}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-neutral-800/60 rounded-lg p-3">
          <div className="text-[11px] text-neutral-400">Influence</div>
          <div className="text-xl text-orange-400 font-mono">{user.influenceScore ?? 0}</div>
        </div>
        <div className="bg-neutral-800/60 rounded-lg p-3">
          <div className="text-[11px] text-neutral-400">Followers</div>
          <div className="text-xl text-neutral-100 font-mono">{numberCompact(user.followers)}</div>
        </div>
        <div className="bg-neutral-800/60 rounded-lg p-3">
          <div className="text-[11px] text-neutral-400">Leaderboard</div>
          <div className="text-xl text-neutral-100 font-mono">
            #
            {user.rank}
          </div>
        </div>
      </div>

      <Separator className="bg-neutral-800" />
      <div className="text-xs text-neutral-400 leading-relaxed">
        <div className="flex items-center justify-between">
          <span>First mentioned</span>
          <span className="text-neutral-300">{user.firstMentionAt ? new Date(user.firstMentionAt).toLocaleString() : '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Total tweets captured</span>
          <span className="text-neutral-300">{user.tweets}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Mention share</span>
          <span className="text-neutral-300">
            {user.mentionShare.toFixed(1)}
            %
          </span>
        </div>
      </div>
    </div>
  );
}

// —— 用于 HoverCard 的容器（带 Card 外壳） ——
function ProfileSummaryHover({ user }: { user: Participant | null }) {
  return (
    <Card className="bg-neutral-900 border-neutral-700 text-neutral-200 w-[320px]">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-mono">Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <ProfileSummaryBody user={user} />
      </CardContent>
    </Card>
  );
}

// —— Top Participants ——
function TopParticipants({ data, onPick }: { data: Participant[]; onPick: (p: Participant) => void }) {
  const [sortKey, setSortKey] = useState<keyof Participant>('rank');
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');
  const [q, setQ] = useState('');

  const sorted = useMemo(() => {
    const list = data.filter(p => [p.handle, p.displayName].join(' ').toLowerCase().includes(q.toLowerCase()));
    return [...list].sort((a, b) => {
      const va = a[sortKey] as any;
      const vb = b[sortKey] as any;
      const res = va > vb ? 1 : va < vb ? -1 : 0;
      return dir === 'asc' ? res : -res;
    });
  }, [data, sortKey, dir, q]);

  const clickSort = (k: keyof Participant) => {
    if (sortKey === k) {
      setDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(k);
      setDir('desc');
    }
  };

  return (
    <Card className="bg-neutral-900 border-neutral-700 text-neutral-200">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-mono text-neutral-200 flex items-center justify-between">
          <span>Top Participants</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 bg-transparent border-orange-400 text-orange-400 text-xs">Columns</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Toggle fields</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>Rank</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>User</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>Mention %</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>Tweets</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>Followers</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>First mentioned</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
        <div className="px-1">
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter by @user or name" className="h-8 bg-neutral-900 border-neutral-700 text-xs text-orange-400" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-12 px-2 py-2 text-[11px] font-mono text-neutral-400 uppercase">
          <button type="button" className="col-span-1 text-left" onClick={() => clickSort('rank')}><SortableHeader active={sortKey === 'rank'} dir={dir}>#</SortableHeader></button>
          <button type="button" className="col-span-4 text-left" onClick={() => clickSort('handle')}><SortableHeader active={sortKey === 'handle'} dir={dir}>User</SortableHeader></button>
          <button type="button" className="col-span-2 text-right" onClick={() => clickSort('mentionShare')}><SortableHeader active={sortKey === 'mentionShare'} dir={dir}>Mkt Share</SortableHeader></button>
          <button type="button" className="col-span-2 text-right" onClick={() => clickSort('tweets')}><SortableHeader active={sortKey === 'tweets'} dir={dir}>Tweets</SortableHeader></button>
          <button type="button" className="col-span-1 text-right" onClick={() => clickSort('followers')}><SortableHeader active={sortKey === 'followers'} dir={dir}>Fols</SortableHeader></button>
          <button type="button" className="col-span-2 text-right" onClick={() => clickSort('firstMentionAt')}><SortableHeader active={sortKey === 'firstMentionAt'} dir={dir}>First</SortableHeader></button>
        </div>
        <ScrollArea className="h-[360px]">
          <ul className="divide-y divide-neutral-800">
            {sorted.map(p => (
              <li key={p.handle}>
                <button
                  type="button"
                  className="w-full grid grid-cols-12 items-center px-2 py-2 hover:bg-neutral-800/60 cursor-pointer text-left"
                  onClick={() => onPick(p)}
                >
                  <div className="col-span-1 text-xs text-neutral-400">
                    #
                    {p.rank}
                  </div>
                  <div className="col-span-4 flex items-center gap-2">
                    <HoverCard openDelay={80} closeDelay={80}>
                      <HoverCardTrigger asChild>
                        <div className="flex items-center gap-2 cursor-default">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={p.avatar} alt={p.displayName} />
                            <AvatarFallback>{p.displayName.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="leading-tight">
                            <div className="text-xs text-neutral-200">{p.displayName}</div>
                            <div className="text-[11px] text-neutral-500">
                              @
                              {p.handle}
                            </div>
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent side="right" align="start" className="p-0 bg-transparent border-0">
                        <ProfileSummaryHover user={p} />
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <div className="col-span-2 text-right text-xs text-neutral-200">
                    {p.mentionShare.toFixed(1)}
                    %
                  </div>
                  <div className="col-span-2 text-right text-xs">{p.tweets}</div>
                  <div className="col-span-1 text-right text-xs">{numberCompact(p.followers)}</div>
                  <div className="col-span-2 text-right text-[11px] text-neutral-400">{p.firstMentionAt ? new Date(p.firstMentionAt).toLocaleDateString() : '—'}</div>
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// —— InteractionRow（展开区内单条，头像悬浮卡片） ——
function InteractionRow({ item }: { item: InteractionItem }) {
  const typeBadge = {
    reply: 'bg-emerald-600/20 text-emerald-300 border-emerald-700',
    retweet: 'bg-sky-600/20 text-sky-300 border-sky-700',
    quote: 'bg-amber-600/20 text-amber-300 border-amber-700',
  }[item.type];

  return (
    <div className="flex gap-3 px-3 py-2">
      <HoverCard openDelay={80} closeDelay={80}>
        <HoverCardTrigger asChild>
          <Avatar className="h-6 w-6 flex-none cursor-default">
            <AvatarImage src={item.avatar} />
            <AvatarFallback>{item.userName.slice(0, 2)}</AvatarFallback>
          </Avatar>
        </HoverCardTrigger>
        <HoverCardContent side="right" align="start" className="p-0 bg-transparent border-0">
          <ProfileSummaryHover
            user={{
              rank: 0,
              handle: item.userHandle,
              displayName: item.userName,
              avatar: item.avatar,
              mentionShare: 0,
              tweets: 0,
              followers: 0,
            }}
          />
        </HoverCardContent>
      </HoverCard>

      <div className="min-w-0 grow">
        <div className="flex items-center gap-2 text-[11px] text-neutral-400">
          <span className="text-neutral-200">{item.userName}</span>
          <span>
            @
            {item.userHandle}
          </span>
          <span>
            •
            {timeAgo(item.createdAt)}
          </span>
          <Badge variant="secondary" className={`h-5 ${typeBadge}`}>{item.type}</Badge>
        </div>
        {item.text && (
          <div className="text-sm text-neutral-100 leading-snug whitespace-pre-wrap">{item.text}</div>
        )}
        {!item.text && item.type === 'retweet' && (
          <div className="text-[12px] text-neutral-400">retweet</div>
        )}
      </div>
    </div>
  );
}

// —— Tweet item（图标操作 + 分类型展开） ——
function TweetRow({
  t,
  highlightFirst,
  expandedType,
  onToggleExpand,
}: {
  t: Tweet;
  highlightFirst?: boolean;
  expandedType?: 'reply' | 'retweet' | 'quote' | null;
  onToggleExpand?: (id: string, type: 'reply' | 'retweet' | 'quote') => void;
}) {
  // 过滤选择的类型
  const listByType = React.useMemo(() => {
    const all = t.interactions || [];
    if (!expandedType) {
      return [];
    }
    return [...all.filter(i => i.type === expandedType)].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );
  }, [t.interactions, expandedType]);

  const iconBase = 'flex items-center gap-1 transition-colors';
  const activeCls = 'text-orange-400';
  const idleCls = 'text-neutral-400 hover:text-orange-400';

  return (
    <div className="px-3 py-3 hover:bg-neutral-800/60">
      <div className="flex gap-3">
        {/* 头像 + 悬浮卡片 */}
        <HoverCard openDelay={80} closeDelay={80}>
          <HoverCardTrigger asChild>
            <Avatar className="h-8 w-8 flex-none cursor-default">
              <AvatarImage src={`https://unavatar.io/twitter/${t.authorHandle}`} />
              <AvatarFallback>{t.authorName.slice(0, 2)}</AvatarFallback>
            </Avatar>
          </HoverCardTrigger>
          <HoverCardContent side="right" align="start" className="p-0 bg-transparent border-0">
            <ProfileSummaryHover
              user={{
                rank: 0,
                handle: t.authorHandle,
                displayName: t.authorName,
                avatar: `https://unavatar.io/twitter/${t.authorHandle}`,
                mentionShare: 0,
                tweets: 0,
                followers: 0,
              }}
            />
          </HoverCardContent>
        </HoverCard>

        <div className="min-w-0 grow">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="text-neutral-200">{t.authorName}</span>
            <span>
              @
              {t.authorHandle}
            </span>
            <span>
              •
              {timeAgo(t.createdAt)}
            </span>
            {highlightFirst && t.firstInteraction && (
              <Badge variant="secondary" className="bg-emerald-600/20 text-emerald-300 border-emerald-700">first interaction</Badge>
            )}
          </div>

          <div className="text-sm text-neutral-100 leading-snug whitespace-pre-wrap">{t.text}</div>

          {/* 图标操作区（点击切换/收起） */}
          <div className="mt-2 flex items-center gap-5 text-[12px]">
            <TooltipProvider delayDuration={50}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(iconBase, expandedType === 'reply' ? activeCls : idleCls)}
                    onClick={() => onToggleExpand?.(t.id, 'reply')}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{t.replies ?? 0}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-900 border-neutral-700 text-neutral-200 text-xs">replies</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={50}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(iconBase, expandedType === 'retweet' ? activeCls : idleCls)}
                    onClick={() => onToggleExpand?.(t.id, 'retweet')}
                  >
                    <Repeat2 className="h-4 w-4" />
                    <span>{t.retweets ?? 0}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-900 border-neutral-700 text-neutral-200 text-xs">retweets</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={50}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(iconBase, expandedType === 'quote' ? activeCls : idleCls)}
                    onClick={() => onToggleExpand?.(t.id, 'quote')}
                  >
                    <Quote className="h-4 w-4" />
                    <span>{t.quotes ?? 0}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-900 border-neutral-700 text-neutral-200 text-xs">quote tweets</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* IP 提示保留 */}
            <TooltipProvider delayDuration={50}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-2 text-neutral-300 cursor-help">
                    IP
                    {ipScore(t)}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-900 border-neutral-700 text-neutral-200 text-xs">
                  interaction points = replies + 2×retweets + 3×likes
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* 展开区：只显示选中类型的列表 */}
          {!!expandedType && (
            <div className="mt-3 border-t border-neutral-800">
              {listByType.length === 0
                ? (
                    <div className="px-3 py-3 text-[12px] text-neutral-500">
                      No
                      {expandedType}
                      s
                    </div>
                  )
                : (
                    <div className="max-h-64 overflow-auto">
                      <ul className="divide-y divide-neutral-800">
                        {listByType.map(item => (
                          <li key={item.id}>
                            <InteractionRow item={item} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// —— Recent Tweets：管理展开状态（按类型） —— //
function RecentTweets({
  tweets,
  title = 'Recent Tweets',
  onRefresh,
  selectedUser,
}: {
  tweets: Tweet[];
  title?: string;
  onRefresh?: () => void;
  selectedUser?: Participant | null;
}) {
  type ExpandState = { id: string; type: 'reply' | 'retweet' | 'quote' } | null;
  const [expanded, setExpanded] = useState<ExpandState>(null);

  const handleToggleExpand = (id: string, type: 'reply' | 'retweet' | 'quote') => {
    setExpanded((curr) => {
      if (!curr) {
        return { id, type };
      }
      if (curr.id === id && curr.type === type) {
        return null;
      } // same -> collapse
      if (curr.id === id) {
        return { id, type };
      } // switch type on same tweet
      return { id, type }; // open another tweet
    });
  };

  return (
    <Card className="bg-neutral-900 border-neutral-700 text-neutral-200">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono">
            {title}
            {selectedUser ? ` · @${selectedUser.handle}` : ''}
          </CardTitle>
          <div className="flex items-center gap-2">
            {selectedUser && (
              <Badge className="bg-neutral-800 border-neutral-700 text-[11px] font-mono" variant="outline">
                {numberCompact(selectedUser.followers)}
                {' '}
                followers
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 bg-transparent border-orange-400 text-orange-400 text-[11px]"
              onClick={onRefresh}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[360px]">
          {tweets.length === 0
            ? (
                <div className="h-[360px] grid place-items-center text-neutral-500 text-sm">No tweets</div>
              )
            : (
                <ul className="divide-y divide-neutral-800">
                  {tweets.map(t => (
                    <li key={t.id}>
                      <TweetRow
                        t={t}
                        highlightFirst
                        expandedType={expanded && expanded.id === t.id ? expanded.type : null}
                        onToggleExpand={handleToggleExpand}
                      />
                    </li>
                  ))}
                </ul>
              )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// —— DatePicker 组件 ——
function DatePicker({
  date,
  onDateChange,
  isOpen,
  onOpenChange,
  placeholder,
}: {
  date: Date;
  onDateChange: (date: Date) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder: string;
}) {
  const formatDateTime = (date: Date) =>
    date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-7 bg-transparent border-orange-400 text-orange-400 text-xs font-mono justify-start text-left',
            !date && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
          {date ? formatDateTime(date) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-700" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            if (selectedDate) {
              onDateChange(selectedDate);
              onOpenChange(false);
            }
          }}
          disabled={d => d > new Date() || d < new Date('1900-01-01')}
          initialFocus
          className="bg-neutral-900 text-neutral-200"
        />
      </PopoverContent>
    </Popover>
  );
}

// —— Main Page ——
export default function MonitorPage() {
  const { subscribeToUser, isConnected } = useWebSocket();
  const { columns, addColumn } = useMonitorColumnsStore();
  const { clientId } = useAuthStore();

  const _handleAddColumn = async (username: string) => {
    if (columns.length >= 10) {
      return;
    }
    if (!isConnected) {
      toast.error('Not connected to server. Please try again.');
      return;
    }
    try {
      const response = await fetchApi(`${Env.NEXT_PUBLIC_API_HOST}/api/v1/subscription/check-limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, twitterUsername: username }),
      });
      const result = await response.json();
      if (!result.data.canAddSubscription) {
        if (!result.data.twitterUserExists) {
          toast.error('Twitter user does not exist.');
          return;
        }
        toast.error(`Subscription limit reached. You can only monitor ${result.data.subLimit} users.`);
        return;
      }
      subscribeToUser(username);
      addColumn({ id: uuidv4(), name: username, usernames: [username] });
    } catch (error) {
      console.error('Failed to check subscription limit:', error);
      toast.error('Failed to check subscription limit. Please try again.');
    }
  };

  // 日期范围 - 默认显示最近10天
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const today = new Date();
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 9); // 包含今天，所以是9天前
    return {
      from: tenDaysAgo,
      to: today,
    };
  });
  const [isFromCalendarOpen, setIsFromCalendarOpen] = useState(false);
  const [isToCalendarOpen, setIsToCalendarOpen] = useState(false);

  // 预设时间范围
  type PresetKey = '30s' | '1h' | '6h' | '7d' | '30d';
  const PRESETS: Record<PresetKey, { label: string; value: number }> = {
    '30s': { label: '30 seconds', value: 30 * 1000 },
    '1h': { label: '1 hour', value: 60 * 60 * 1000 },
    '6h': { label: '6 hours', value: 6 * 60 * 60 * 1000 },
    '7d': { label: '7 days', value: 7 * 24 * 60 * 60 * 1000 },
    '30d': { label: '30 days', value: 30 * 24 * 60 * 60 * 1000 },
  };
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);
  function applyPreset(p: PresetKey) {
    const now = new Date();
    const from = new Date(now.getTime() - PRESETS[p].value);
    setActivePreset(p);
    setDateRange({ from, to: now });
  }

  // 过滤选项
  const [firstMentionOnly, setFirstMentionOnly] = useState(false);
  const [keywords, setKeywords] = useState<string[]>(['level:>50']);
  const [keywordInput, setKeywordInput] = useState('');

  // —— twitter local state ——
  const [participants] = useState<Participant[]>(DEMO_PARTICIPANTS);
  const [selected, setSelected] = useState<Participant | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>(DEMO_TWEETS);

  // Series
  const seriesData = React.useMemo(() => {
    const start = new Date(dateRange.from);
    const end = new Date(dateRange.to);
    const key = (d: Date) => d.toISOString().slice(0, 10);
    const days: Record<string, { date: string; tweets: number; ip: number; first: number }> = {};
    for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
      const k = key(d);
      days[k] = { date: k, tweets: 0, ip: 0, first: 0 };
    }
    const source = firstMentionOnly ? tweets.filter(t => t.firstInteraction) : tweets;
    for (const t of source) {
      const d = new Date(t.createdAt);
      if (d < start || d > end) {
        continue;
      }
      const k = key(d);
      if (!days[k]) {
        days[k] = { date: k, tweets: 0, ip: 0, first: 0 };
      }
      days[k].tweets += 1;
      days[k].ip += (t.replies || 0) + 2 * (t.retweets || 0) + 3 * (t.likes || 0);
      if (t.firstInteraction) {
        days[k].first += 1;
      }
    }
    return Object.values(days);
  }, [tweets, dateRange, firstMentionOnly]);

  const refreshTweets = () => setTweets(prev => [...prev].sort(() => Math.random() - 0.5));

  // metrics
  const metrics = useMemo(() => {
    const totalTweets = tweets.length;
    const uniqueUsers = new Set(tweets.map(t => t.authorHandle)).size;
    const pctUsers = participants.length ? (uniqueUsers / participants.length) * 100 : 0;
    const totalIP = tweets.reduce((s, t) => s + ipScore(t), 0);
    const firstInter = tweets.filter(t => t.firstInteraction).length;
    return { totalTweets, uniqueUsers, pctUsers, totalIP, firstInter };
  }, [tweets, participants.length]);

  const addKeyword = () => {
    if (!keywordInput.trim()) {
      return;
    }
    setKeywords(k => Array.from(new Set([...k, keywordInput.trim()])));
    setKeywordInput('');
  };
  const removeKeyword = (kw: string) => setKeywords(k => k.filter(x => x !== kw));

  // —— Chart drag-select zoom —— //
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);

  function onChartMouseDown(e: any) {
    if (!e || !e.activeLabel) {
      return;
    }
    setRefAreaLeft(e.activeLabel as string);
    setRefAreaRight(null);
  }
  function onChartMouseMove(e: any) {
    if (!refAreaLeft || !e || !e.activeLabel) {
      return;
    }
    setRefAreaRight(e.activeLabel as string);
  }
  function onChartMouseUp() {
    if (!refAreaLeft || !refAreaRight) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }
    const left = new Date(refAreaLeft);
    const right = new Date(refAreaRight);
    const from = left < right ? left : right;
    const to = left < right ? right : left;

    const fromAdj = new Date(from);
    const toAdj = new Date(to);
    toAdj.setHours(23, 59, 59, 999);

    setDateRange({ from: fromAdj, to: toAdj });
    setActivePreset(null);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  }

  return (
    <div className="bg-black min-h-screen">
      {/* —— Top bar —— */}
      <div className="bg-neutral-900 border-y border-neutral-700 text-xs font-mono">
        <div className="h-10 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-neutral-300">Connection</span>
            </div>

            {/* 预设时间范围下拉菜单 */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Range</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 bg-transparent border-orange-400 text-orange-400 text-xs font-mono"
                  >
                    {activePreset ? PRESETS[activePreset].label : 'Custom Range'}
                    <ChevronDownIcon className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40 bg-neutral-900 border-neutral-700">
                  <DropdownMenuLabel className="text-xs text-neutral-400">Quick Range</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-neutral-700" />
                  {(['30s', '1h', '6h', '7d', '30d'] as const).map(p => (
                    <DropdownMenuCheckboxItem
                      key={p}
                      checked={activePreset === p}
                      onCheckedChange={() => applyPreset(p)}
                      className="text-xs text-orange-400 focus:text-orange-400 focus:bg-orange-400/10"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{PRESETS[p].label}</span>
                        <span className="text-neutral-500 font-mono">{p}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-orange-400">From</span>
              <DatePicker
                date={dateRange.from}
                onDateChange={(date) => {
                  setActivePreset(null);
                  setDateRange(prev => ({ ...prev, from: date }));
                }}
                isOpen={isFromCalendarOpen}
                onOpenChange={setIsFromCalendarOpen}
                placeholder="Select start date"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-400">To</span>
              <DatePicker
                date={dateRange.to}
                onDateChange={(date) => {
                  setActivePreset(null);
                  setDateRange(prev => ({ ...prev, to: date }));
                }}
                isOpen={isToCalendarOpen}
                onOpenChange={setIsToCalendarOpen}
                placeholder="Select end date"
              />
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-transparent border-orange-400 text-orange-400"
                onClick={() => {
                  const daysDiff = Math.max(1, Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)));
                  const newDaysDiff = Math.min(365, Math.round(daysDiff * 1.5));
                  const newTo = new Date(dateRange.from.getTime() + newDaysDiff * 24 * 60 * 60 * 1000);
                  setActivePreset(null);
                  setDateRange(prev => ({ ...prev, to: newTo }));
                }}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-transparent border-orange-400 text-orange-400"
                onClick={() => {
                  const daysDiff = Math.max(1, Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)));
                  const newDaysDiff = Math.max(1, Math.round(daysDiff / 1.5));
                  const newTo = new Date(dateRange.from.getTime() + newDaysDiff * 24 * 60 * 60 * 1000);
                  setActivePreset(null);
                  setDateRange(prev => ({ ...prev, to: newTo }));
                }}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* keywords row */}
        <div className="h-10 flex items-center px-4 gap-3">
          <div className="text-neutral-400">keywords</div>
          <div className="flex flex-wrap gap-2">
            {keywords.map(kw => (
              <Badge key={kw} variant="secondary" className="bg-neutral-800 border-neutral-700 text-neutral-200">
                {kw}
                <button
                  type="button"
                  className="ml-1 text-neutral-400 hover:text-neutral-200 bg-transparent text-orange-400"
                  onClick={() => removeKeyword(kw)}
                  aria-label="remove keyword"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input value={keywordInput} onChange={e => setKeywordInput(e.target.value)} placeholder='e.g. "level:>50"' className="h-7 bg-neutral-900 border-neutral-700 text-xs text-orange-400 w-56" />
            <Button variant="outline" className="h-7 bg-transparent border-orange-400 text-orange-400" onClick={addKeyword}>Add</Button>
          </div>
          <div className="ml-auto flex items-center gap-2 text-orange-400">
            <div className="border border-neutral-700 text-white px-2">==</div>
            <div className="border border-neutral-700 px-2">!=</div>
            <div className="border border-neutral-700 px-2">ABC</div>
            <div className="flex items-center justify-between">
              <label htmlFor="first-mention-checkbox" className="flex items-center gap-2 text-xs text-neutral-300">
                <Checkbox id="first-mention-checkbox" checked={firstMentionOnly} onCheckedChange={v => setFirstMentionOnly(Boolean(v))} />
                first mention
              </label>
            </div>
          </div>
        </div>

        {/* summary row */}
        <div className="h-9 flex items-center justify-between px-4">
          <div className="text-orange-400">summary</div>
          <div className="text-orange-400">
            Returned:
            {metrics.totalTweets}
            {' '}
            Lines
          </div>
        </div>
      </div>

      {/* helper hint line */}
      <div className="px-4 py-2 text-[11px] text-neutral-400 font-mono">
        <span className="mr-2">first interactions:</span>
        <span>the first time a user has ever @-replied a tweet containing any of the keywords in search.</span>
      </div>

      {/* metrics bar */}
      <div className="px-4 pb-2">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 lg:col-span-9 grid grid-cols-6 gap-3 text-center">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3">
              <div className="text-[11px] text-neutral-400">amount</div>
              <div className="text-lg font-mono text-neutral-100">{metrics.totalTweets}</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3">
              <div className="text-[11px] text-neutral-400">interaction points</div>
              <div className="text-lg font-mono text-orange-400">{metrics.totalIP}</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3">
              <div className="text-[11px] text-neutral-400">first mentioned</div>
              <div className="text-lg font-mono text-neutral-100">—</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3">
              <div className="text-[11px] text-neutral-400">first interactions</div>
              <div className="text-lg font-mono text-neutral-100">{metrics.firstInter}</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3">
              <div className="text-[11px] text-neutral-400">total tweets</div>
              <div className="text-lg font-mono text-neutral-100">{metrics.totalTweets}</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3">
              <div className="text-[11px] text-neutral-400">% of total users</div>
              <div className="text-lg font-mono text-neutral-100">
                {metrics.pctUsers.toFixed(1)}
                %
              </div>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-3 flex items-center justify-end text-[11px] text-neutral-400">
            <TooltipProvider delayDuration={50}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">interaction points = replies + 2×retweets + 3×likes</div>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-900 border-neutral-700 text-neutral-200 text-xs">Use this to compare engagement intensity across users and time ranges.</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* —— chart —— */}
      <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
        <AreaChart
          data={seriesData}
          onMouseDown={onChartMouseDown}
          onMouseMove={onChartMouseMove}
          onMouseUp={onChartMouseUp}
        >
          <defs>
            <linearGradient id="fillTweets" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-tweets)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-tweets)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillIP" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-ip)" stopOpacity={0.6} />
              <stop offset="95%" stopColor="var(--color-ip)" stopOpacity={0.08} />
            </linearGradient>
            <linearGradient id="fillFirst" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-first)" stopOpacity={0.5} />
              <stop offset="95%" stopColor="var(--color-first)" stopOpacity={0.06} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(v: string) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={value => value.toString()}
          />

          <ChartTooltip
            cursor={false}
            content={(
              <ChartTooltipContent
                labelFormatter={(v: string) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                indicator="dot"
              />
            )}
          />

          {/* tweets（日推文数） */}
          <Area dataKey="tweets" type="natural" fill="url(#fillTweets)" stroke="var(--color-tweets)" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
          {/* interaction points（日互动分） */}
          <Area dataKey="ip" type="natural" fill="url(#fillIP)" stroke="var(--color-ip)" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
          {/* first interactions（日首次互动） */}
          <Area dataKey="first" type="natural" fill="url(#fillFirst)" stroke="var(--color-first)" strokeWidth={1.2} dot={false} activeDot={{ r: 3 }} />

          {refAreaLeft && refAreaRight && (
            <ReferenceArea
              x1={refAreaLeft}
              x2={refAreaRight}
              strokeOpacity={0.3}
              fill="rgba(251, 133, 0, 0.15)"
              stroke="rgba(251, 133, 0, 0.35)"
            />
          )}
        </AreaChart>
      </ChartContainer>

      {/* —— Twitter Panels —— */}
      <div className="px-3 py-4">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 lg:col-span-6">
            <TopParticipants data={DEMO_PARTICIPANTS} onPick={p => setSelected(p)} />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <RecentTweets tweets={tweets} selectedUser={selected} onRefresh={refreshTweets} />
          </div>
          {/* 右侧固定 Profile 已移除；改为头像 HoverCard 悬浮显示 */}
        </div>
      </div>
    </div>
  );
}
