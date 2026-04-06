import { delay, http, HttpResponse } from 'msw';
import type { ActivityListItem } from '../../types';

const FIXTURE_ACTIVITIES: ActivityListItem[] = [
  {
    id: 101,
    title: '2026 张杰「开往 1982」巡回演唱会 北京站',
    description: '沉浸式视听大秀，覆盖经典代表作与全新舞台章节。',
    coverUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
    location: '北京 国家体育场-鸟巢',
    category: 'CONCERT',
    tags: ['张杰', '演唱会', '流行'],
    maxCapacity: 80000,
    price: 380,
    enrollOpenAt: '2026-04-06T11:00:00Z',
    enrollCloseAt: '2026-04-19T12:00:00Z',
    activityAt: '2026-06-06T11:00:00Z',
    status: 'SELLING_OUT',
    enrollCount: 67123,
    viewCount: 198223,
    stockRemaining: 12877,
  },
  {
    id: 102,
    title: '2026 都可以“我怪”巡回演唱会 北京站',
    description: '先锋视觉与乐队编制升级，适合第一次看现场的乐迷。',
    coverUrl:
      'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80',
    location: '北京 国家体育馆',
    category: 'CONCERT',
    tags: ['都可以', '巡演'],
    maxCapacity: 26000,
    price: 380,
    enrollOpenAt: '2026-04-08T12:00:00Z',
    enrollCloseAt: '2026-04-20T12:00:00Z',
    activityAt: '2026-06-06T12:00:00Z',
    status: 'PUBLISHED',
    enrollCount: 12690,
    viewCount: 88110,
    stockRemaining: 13310,
  },
  {
    id: 103,
    title: '丝路沉浸艺术特展',
    description: '大型文博叙事展，结合数字投影与文物线索重建丝路旅程。',
    coverUrl:
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=900&q=80',
    location: '北京 保利美高梅博物馆',
    category: 'EXHIBITION',
    tags: ['展览', '艺术', '文博'],
    maxCapacity: 18000,
    price: 0,
    enrollOpenAt: '2026-04-02T09:00:00Z',
    enrollCloseAt: '2026-04-30T12:00:00Z',
    activityAt: '2026-04-30T12:00:00Z',
    status: 'PUBLISHED',
    enrollCount: 5022,
    viewCount: 43770,
    stockRemaining: 12978,
  },
  {
    id: 104,
    title: '开心麻花《乌龙山伯爵》特别场',
    description: '经典喜剧作品返场，适合周末家庭与情侣观演。',
    coverUrl:
      'https://images.unsplash.com/photo-1507924538820-ede94a04019d?auto=format&fit=crop&w=900&q=80',
    location: '上海 海派剧院',
    category: 'THEATER',
    tags: ['开心麻花', '话剧', '喜剧'],
    maxCapacity: 3600,
    price: 180,
    enrollOpenAt: '2026-04-10T08:00:00Z',
    enrollCloseAt: '2026-04-19T12:00:00Z',
    activityAt: '2026-04-19T12:00:00Z',
    status: 'PUBLISHED',
    enrollCount: 2678,
    viewCount: 20800,
    stockRemaining: 922,
  },
  {
    id: 105,
    title: '2026 城市德比篮球联赛决赛',
    description: '城市职业联赛巅峰对决，主场氛围与周边联动活动同步开放。',
    coverUrl:
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80',
    location: '广州 天河体育中心',
    category: 'SPORTS',
    tags: ['篮球', '联赛', '广州'],
    maxCapacity: 12000,
    price: 120,
    enrollOpenAt: '2026-04-06T10:00:00Z',
    enrollCloseAt: '2026-04-07T10:00:00Z',
    activityAt: '2026-04-07T10:00:00Z',
    status: 'PUBLISHED',
    enrollCount: 10340,
    viewCount: 45700,
    stockRemaining: 1660,
  },
  {
    id: 106,
    title: '草莓音乐节·成都站',
    description: '两日多舞台阵容，覆盖摇滚、独立与电子乐分区。',
    coverUrl:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
    location: '成都 国际音乐公园',
    category: 'MUSIC',
    tags: ['音乐节', '成都', '摇滚'],
    maxCapacity: 38000,
    price: 369,
    enrollOpenAt: '2026-05-01T02:00:00Z',
    enrollCloseAt: '2026-05-04T02:00:00Z',
    activityAt: '2026-05-04T02:00:00Z',
    status: 'PREHEAT',
    enrollCount: 0,
    viewCount: 112300,
    stockRemaining: 38000,
  },
  {
    id: 107,
    title: '儿童创想亲子剧场《宇宙快递》',
    description: '互动式儿童舞台剧，加入现场科学小实验环节。',
    coverUrl:
      'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80',
    location: '杭州 大剧院',
    category: 'CHILDREN',
    tags: ['亲子', '儿童', '舞台剧'],
    maxCapacity: 1500,
    price: 99,
    enrollOpenAt: '2026-04-12T09:00:00Z',
    enrollCloseAt: '2026-04-27T10:00:00Z',
    activityAt: '2026-04-27T10:00:00Z',
    status: 'PUBLISHED',
    enrollCount: 770,
    viewCount: 12020,
    stockRemaining: 730,
  },
  {
    id: 108,
    title: '城市芭蕾 gala 夜',
    description: '集结国际舞者与交响乐团的限定夜场演出。',
    coverUrl:
      'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=900&q=80',
    location: '深圳 海岸艺术中心',
    category: 'DANCE',
    tags: ['芭蕾', '舞蹈', '交响'],
    maxCapacity: 2800,
    price: 280,
    enrollOpenAt: '2026-04-14T09:00:00Z',
    enrollCloseAt: '2026-05-12T10:00:00Z',
    activityAt: '2026-05-12T10:00:00Z',
    status: 'PUBLISHED',
    enrollCount: 1360,
    viewCount: 14990,
    stockRemaining: 1440,
  },
  {
    id: 109,
    title: '陈奕迅 FEAR and DREAMS 巡回演唱会 深圳站',
    description: '超长 setlist 与沉浸式灯光编排，覆盖经典曲目与编曲重制版本。',
    coverUrl:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80',
    location: '深圳 大运中心体育馆',
    category: 'CONCERT',
    tags: ['陈奕迅', '演唱会', '粤语'],
    maxCapacity: 30000,
    price: 680,
    enrollOpenAt: '2026-04-06T09:00:00Z',
    enrollCloseAt: '2026-04-18T15:00:00Z',
    activityAt: '2026-05-22T12:00:00Z',
    status: 'SELLING_OUT',
    enrollCount: 28920,
    viewCount: 210330,
    stockRemaining: 1080,
  },
  {
    id: 110,
    title: '周深 深空间音乐会 杭州站',
    description: '管弦编制升级，配合全场音场重构，适合沉浸式聆听体验。',
    coverUrl: null,
    location: '杭州 黄龙体育中心',
    category: 'CONCERT',
    tags: ['周深', '音乐会', '现场'],
    maxCapacity: 26000,
    price: 520,
    enrollOpenAt: '2026-04-20T10:00:00Z',
    enrollCloseAt: '2026-04-30T10:00:00Z',
    activityAt: '2026-06-01T11:00:00Z',
    status: 'PREHEAT',
    enrollCount: 0,
    viewCount: 86220,
    stockRemaining: 26000,
  },
];

const stockSnapshot = new Map<number, number>(
  FIXTURE_ACTIVITIES.map((item) => [item.id, item.stockRemaining]),
);

const cityCoordinates: Record<string, { latitude: number; longitude: number }> = {
  北京: { latitude: 39.9042, longitude: 116.4074 },
  上海: { latitude: 31.2304, longitude: 121.4737 },
  广州: { latitude: 23.1291, longitude: 113.2644 },
  深圳: { latitude: 22.5431, longitude: 114.0579 },
  杭州: { latitude: 30.2741, longitude: 120.1551 },
  成都: { latitude: 30.5728, longitude: 104.0668 },
};

function resolveCoordinates(location: string) {
  const city = Object.keys(cityCoordinates).find((key) => location.includes(key));
  return city ? cityCoordinates[city] : { latitude: 39.9042, longitude: 116.4074 };
}

function includesMatch(source: string, query: string) {
  return source.toLowerCase().includes(query.toLowerCase());
}

function parseSort(value: string | null) {
  if (value === 'hot' || value === 'soon' || value === 'recent' || value === 'relevance') {
    return value;
  }

  return 'relevance';
}

function score(item: ActivityListItem, keyword: string, region: string, artist: string) {
  let relevance = 0;

  if (keyword) {
    const loweredKeyword = keyword.toLowerCase();
    const title = item.title.toLowerCase();
    const description = item.description.toLowerCase();

    if (title === loweredKeyword) {
      relevance += 120;
    } else if (title.includes(loweredKeyword)) {
      relevance += 90;
    } else if (description.includes(loweredKeyword)) {
      relevance += 30;
    }
  }

  if (artist) {
    const artistLower = artist.toLowerCase();
    if (
      item.tags.some((tag) => includesMatch(tag, artistLower)) ||
      includesMatch(item.title, artistLower)
    ) {
      relevance += 70;
    }
  }

  if (region !== 'ALL' && region && includesMatch(item.location, region)) {
    relevance += 50;
  }

  return relevance + item.enrollCount / 100 + item.viewCount / 500;
}

function applySort(list: ActivityListItem[], sort: string, keyword: string, region: string, artist: string) {
  return [...list].sort((left, right) => {
    if (sort === 'hot') {
      return right.enrollCount - left.enrollCount || right.viewCount - left.viewCount;
    }

    if (sort === 'soon') {
      return new Date(left.enrollOpenAt).getTime() - new Date(right.enrollOpenAt).getTime();
    }

    if (sort === 'recent') {
      return new Date(right.activityAt).getTime() - new Date(left.activityAt).getTime();
    }

    return score(right, keyword, region, artist) - score(left, keyword, region, artist);
  });
}

export const activityHandlers = [
  http.get('http://localhost:8080/api/v1/activities', async ({ request }) => {
    await delay(250);

    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.trim() ?? '';
    const region = url.searchParams.get('region')?.trim() ?? 'ALL';
    const artist = url.searchParams.get('artist')?.trim() ?? '';
    const category = url.searchParams.get('category') ?? 'ALL';
    const sort = parseSort(url.searchParams.get('sort'));
    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('page_size') ?? '12');

    const filtered = FIXTURE_ACTIVITIES.filter((item) => {
      const matchesCategory = category === 'ALL' || category === '' || item.category === category;
      const matchesKeyword =
        !keyword ||
        includesMatch(item.title, keyword) ||
        includesMatch(item.description, keyword);
      const matchesRegion =
        region === 'ALL' || !region || includesMatch(item.location, region);
      const matchesArtist =
        !artist ||
        item.tags.some((tag) => includesMatch(tag, artist)) ||
        includesMatch(item.title, artist);

      return matchesCategory && matchesKeyword && matchesRegion && matchesArtist;
    });

    const ordered = applySort(filtered, sort, keyword, region, artist);
    const start = (page - 1) * pageSize;

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        list: ordered.slice(start, start + pageSize).map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          cover_url: item.coverUrl,
          location: item.location,
          category: item.category,
          tags: item.tags,
          max_capacity: item.maxCapacity,
          price: item.price,
          enroll_open_at: item.enrollOpenAt,
          enroll_close_at: item.enrollCloseAt,
          activity_at: item.activityAt,
          status: item.status,
          enroll_count: item.enrollCount,
          view_count: item.viewCount,
          stock_remaining: item.stockRemaining,
        })),
        total: ordered.length,
        page,
        page_size: pageSize,
      },
    });
  }),
  http.get('http://localhost:8080/api/v1/activities/merchant', async () => {
    await delay(180);

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: FIXTURE_ACTIVITIES.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        cover_url: item.coverUrl,
        location: item.location,
        category: item.category,
        tags: item.tags,
        max_capacity: item.maxCapacity,
        price: item.price,
        enroll_open_at: item.enrollOpenAt,
        enroll_close_at: item.enrollCloseAt,
        activity_at: item.activityAt,
        status: item.status,
        enroll_count: item.enrollCount,
        view_count: item.viewCount,
        stock_remaining: stockSnapshot.get(item.id) ?? item.stockRemaining,
      })),
    });
  }),
  http.post('http://localhost:8080/api/v1/activities', async ({ request }) => {
    await delay(240);
    const body = (await request.json()) as Record<string, unknown>;
    const nextId = Math.max(...FIXTURE_ACTIVITIES.map((item) => item.id)) + 1;

    const maxCapacity = Number(body.max_capacity ?? 0);
    const newActivity: ActivityListItem = {
      id: nextId,
      title: String(body.title ?? ''),
      description: String(body.description ?? ''),
      coverUrl: body.cover_url ? String(body.cover_url) : null,
      location: String(body.location ?? ''),
      category: (body.category as ActivityListItem['category']) ?? 'OTHER',
      tags: [],
      maxCapacity,
      price: Number(body.price ?? 0),
      enrollOpenAt: String(body.enroll_open_at ?? new Date().toISOString()),
      enrollCloseAt: String(body.enroll_close_at ?? new Date().toISOString()),
      activityAt: String(body.activity_at ?? new Date().toISOString()),
      status: 'DRAFT',
      enrollCount: 0,
      viewCount: 0,
      stockRemaining: maxCapacity,
    };

    FIXTURE_ACTIVITIES.unshift(newActivity);
    stockSnapshot.set(nextId, maxCapacity);

    return HttpResponse.json(
      {
        code: 0,
        message: 'ok',
        data: {
          activity_id: nextId,
          status: 'DRAFT',
        },
      },
      { status: 201 },
    );
  }),
  http.put('http://localhost:8080/api/v1/activities/:id', async ({ params, request }) => {
    await delay(240);
    const id = Number(params.id);
    const body = (await request.json()) as Record<string, unknown>;
    const target = FIXTURE_ACTIVITIES.find((item) => item.id === id);
    if (!target) {
      return HttpResponse.json(
        { code: 1004, message: 'activity not found', data: null },
        { status: 404 },
      );
    }

    target.title = String(body.title ?? target.title);
    target.description = String(body.description ?? target.description);
    target.coverUrl = body.cover_url ? String(body.cover_url) : target.coverUrl;
    target.location = String(body.location ?? target.location);
    target.category = (body.category as ActivityListItem['category']) ?? target.category;
    target.maxCapacity = Number(body.max_capacity ?? target.maxCapacity);
    target.price = Number(body.price ?? target.price);
    target.enrollOpenAt = String(body.enroll_open_at ?? target.enrollOpenAt);
    target.enrollCloseAt = String(body.enroll_close_at ?? target.enrollCloseAt);
    target.activityAt = String(body.activity_at ?? target.activityAt);

    if (target.status === 'DRAFT' || target.status === 'PREHEAT') {
      stockSnapshot.set(target.id, target.maxCapacity);
      target.stockRemaining = target.maxCapacity;
    }

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        activity_id: target.id,
        status: target.status,
      },
    });
  }),
  http.put('http://localhost:8080/api/v1/activities/:id/publish', async ({ params }) => {
    await delay(200);
    const id = Number(params.id);
    const target = FIXTURE_ACTIVITIES.find((item) => item.id === id);
    if (!target) {
      return HttpResponse.json(
        { code: 1004, message: 'activity not found', data: null },
        { status: 404 },
      );
    }

    target.status = 'PUBLISHED';
    stockSnapshot.set(target.id, target.maxCapacity);
    target.stockRemaining = target.maxCapacity;

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        activity_id: target.id,
        status: target.status,
        stock_in_cache: target.maxCapacity,
      },
    });
  }),
  http.get('http://localhost:8080/api/v1/activities/:id', async ({ params }) => {
    await delay(220);

    const id = Number(params.id);
    const activity = FIXTURE_ACTIVITIES.find((item) => item.id === id);
    if (!activity) {
      return HttpResponse.json(
        {
          code: 1004,
          message: 'activity not found',
          data: null,
        },
        { status: 404 },
      );
    }

    const coords = resolveCoordinates(activity.location);

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        activity_id: activity.id,
        title: activity.title,
        description: activity.description,
        cover_url: activity.coverUrl,
        location: activity.location,
        category: activity.category,
        tags: activity.tags,
        max_capacity: activity.maxCapacity,
        price: activity.price,
        enroll_open_at: activity.enrollOpenAt,
        enroll_close_at: activity.enrollCloseAt,
        activity_at: activity.activityAt,
        status: activity.status,
        enroll_count: activity.enrollCount,
        view_count: activity.viewCount,
        stock_remaining: activity.stockRemaining,
        latitude: coords.latitude,
        longitude: coords.longitude,
        created_by: {
          user_id: 1,
          username: 'UAAD 官方票务',
        },
      },
    });
  }),
  http.get('http://localhost:8080/api/v1/activities/:id/stock', async ({ params }) => {
    await delay(120);

    const id = Number(params.id);
    const activity = FIXTURE_ACTIVITIES.find((item) => item.id === id);
    if (!activity) {
      return HttpResponse.json(
        {
          code: 1004,
          message: 'activity not found',
          data: null,
        },
        { status: 404 },
      );
    }

    const current = stockSnapshot.get(activity.id) ?? activity.stockRemaining;
    const drift = current > 0 ? Math.floor(Math.random() * 15) : 0;
    const stockRemaining = Math.max(0, current - drift);
    stockSnapshot.set(activity.id, stockRemaining);

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        activity_id: activity.id,
        stock_remaining: stockRemaining,
        max_capacity: activity.maxCapacity,
        last_updated: new Date().toISOString(),
      },
    });
  }),
];
