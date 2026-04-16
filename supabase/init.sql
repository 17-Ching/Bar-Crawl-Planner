-- ================================================================
-- 不醉不歸：酒吧推薦指南 — Supabase 資料庫初始化腳本
-- 執行順序：在 Supabase SQL Editor 中貼入並執行
-- ================================================================

-- ── 啟用 PostGIS 擴充套件 ──────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. users 表
-- ================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username              TEXT NOT NULL DEFAULT '',
  avatar_url            TEXT,
  level                 INT4 NOT NULL DEFAULT 1,
  total_bars_visited    INT4 NOT NULL DEFAULT 0,
  total_routes_completed INT4 NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 自動在新用戶註冊時建立 profile 記錄
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- 2. bars 表（支援 PostGIS 地理座標）
-- ================================================================
CREATE TABLE IF NOT EXISTS public.bars (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  address         TEXT,
  location        GEOGRAPHY(Point, 4326),  -- PostGIS 空間欄位
  category        TEXT NOT NULL DEFAULT 'bar'
                  CHECK (category IN ('bar', 'pub', 'convenience', 'izakaya')),
  tags            TEXT[] DEFAULT '{}',
  avg_price       INT4,
  opening_hours   JSONB DEFAULT '{}',
  cover_image_url TEXT,
  rating          FLOAT4 DEFAULT 0,
  vote_count      INT4 DEFAULT 0,
  submitted_by    UUID REFERENCES public.users(id),
  is_verified     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PostGIS 空間索引（大幅加速範圍搜尋）
CREATE INDEX IF NOT EXISTS bars_location_idx
  ON public.bars USING GIST(location);

-- ================================================================
-- 3. RPC：範圍內酒吧搜尋（ST_DWithin）
-- ================================================================
CREATE OR REPLACE FUNCTION public.bars_within_radius(
  lat FLOAT8,
  lng FLOAT8,
  radius_km FLOAT8 DEFAULT 2
)
RETURNS SETOF public.bars AS $$
  SELECT *
  FROM public.bars
  WHERE ST_DWithin(
    location,
    ST_MakePoint(lng, lat)::GEOGRAPHY,
    radius_km * 1000  -- 轉換為公尺
  )
  ORDER BY ST_Distance(location, ST_MakePoint(lng, lat)::GEOGRAPHY);
$$ LANGUAGE sql STABLE;

-- ================================================================
-- 4. routes 表
-- ================================================================
CREATE TABLE IF NOT EXISTS public.routes (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name                     TEXT NOT NULL,
  description              TEXT DEFAULT '',
  waypoints                JSONB DEFAULT '[]',
  total_distance_km        FLOAT4,
  estimated_duration_min   INT4,
  bar_count                INT4 DEFAULT 0,
  convenience_store_count  INT4 DEFAULT 0,
  difficulty               TEXT DEFAULT 'easy'
                           CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_public                BOOLEAN DEFAULT TRUE,
  like_count               INT4 DEFAULT 0,
  clone_count              INT4 DEFAULT 0,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS routes_creator_idx ON public.routes(creator_id);
CREATE INDEX IF NOT EXISTS routes_public_likes_idx ON public.routes(is_public, like_count DESC);

-- ================================================================
-- 5. route_likes 表
-- ================================================================
CREATE TABLE IF NOT EXISTS public.route_likes (
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  route_id   UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  liked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, route_id)
);

-- 按讚 → 同步更新 routes.like_count
CREATE OR REPLACE FUNCTION public.sync_route_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.routes SET like_count = like_count + 1 WHERE id = NEW.route_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.routes SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.route_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_route_like ON public.route_likes;
CREATE TRIGGER on_route_like
  AFTER INSERT OR DELETE ON public.route_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_route_like_count();

-- ================================================================
-- 6. visit_history 表（打卡記錄）
-- ================================================================
CREATE TABLE IF NOT EXISTS public.visit_history (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bar_id            UUID REFERENCES public.bars(id),
  route_id          UUID REFERENCES public.routes(id),
  checked_in_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note              TEXT DEFAULT '',
  photo_urls        TEXT[] DEFAULT '{}',
  drink_count       INT4 DEFAULT 0,
  mood_emoji        TEXT DEFAULT '🍺',
  location_verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS visit_history_user_idx ON public.visit_history(user_id, checked_in_at DESC);

-- ================================================================
-- 7. achievements 表（成就徽章）
-- ================================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_key    TEXT NOT NULL,
  unlocked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_key)
);

-- ================================================================
-- 8. RPC：打卡後更新用戶統計
-- ================================================================
CREATE OR REPLACE FUNCTION public.increment_user_checkin(uid UUID)
RETURNS VOID AS $$
  UPDATE public.users
  SET
    total_bars_visited = total_bars_visited + 1,
    level = CASE
      WHEN total_bars_visited + 1 >= 150 THEN 5
      WHEN total_bars_visited + 1 >= 70  THEN 4
      WHEN total_bars_visited + 1 >= 30  THEN 3
      WHEN total_bars_visited + 1 >= 10  THEN 2
      ELSE 1
    END
  WHERE id = uid;
$$ LANGUAGE sql;

-- ================================================================
-- 9. Row Level Security (RLS) 設定
-- ================================================================

-- users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用戶可讀取所有 profile"    ON public.users FOR SELECT USING (TRUE);
CREATE POLICY "用戶只能編輯自己的 profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- bars
ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "所有人可讀取酒吧"    ON public.bars FOR SELECT USING (TRUE);
CREATE POLICY "登入用戶可新增酒吧"  ON public.bars FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "只有提交者可刪除"    ON public.bars FOR DELETE USING (auth.uid() = submitted_by);

-- routes
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "公開路線所有人可讀取"      ON public.routes FOR SELECT USING (is_public = TRUE OR auth.uid() = creator_id);
CREATE POLICY "登入用戶可建立路線"        ON public.routes FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "創建者可更新路線"          ON public.routes FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "創建者可刪除路線"          ON public.routes FOR DELETE USING (auth.uid() = creator_id);

-- visit_history
ALTER TABLE public.visit_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用戶可讀取自己的打卡記錄" ON public.visit_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用戶可新增打卡記錄"        ON public.visit_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- route_likes
ALTER TABLE public.route_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "登入用戶可按讚"    ON public.route_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "登入用戶可取消讚"  ON public.route_likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "所有人可看按讚數"  ON public.route_likes FOR SELECT USING (TRUE);

-- achievments
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用戶可讀取自己的成就" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System 可寫入成就"    ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- 10. Storage Bucket 設定（請在 Supabase Dashboard > Storage 建立）
-- ================================================================
-- Bucket 名稱：photos
-- 權限：Public (允許未登入用戶讀取圖片 URL)
-- 建議的 storage policy:
--   INSERT: authenticated users only
--   SELECT: public
--   DELETE: file owner only

-- ================================================================
-- 11. 範例種子資料（台北市酒吧，可選擇性執行）
-- ================================================================
INSERT INTO public.bars (name, address, location, category, tags, avg_price, is_verified)
VALUES
  ('Alchemy Bar',    '台北市信義區松壽路9號',    ST_MakePoint(121.5632, 25.0445)::GEOGRAPHY, 'bar',         ARRAY['craft_cocktail','fancy'],       800,  TRUE),
  ('The Rabbit Hole','台北市大安區和平東路一段',  ST_MakePoint(121.5544, 25.0412)::GEOGRAPHY, 'bar',         ARRAY['dive_bar','music'],             400,  TRUE),
  ('Revolver',       '台北市大安區光復南路',     ST_MakePoint(121.5607, 25.0438)::GEOGRAPHY, 'pub',         ARRAY['live_music','craft_beer'],      500,  TRUE),
  ('Draft Land',     '台北市中正區仁愛路二段',   ST_MakePoint(121.5578, 25.0421)::GEOGRAPHY, 'bar',         ARRAY['craft_beer','chill'],           350,  TRUE),
  ('Bar Mood Taipei','台北市中山區南京西路',     ST_MakePoint(121.5513, 25.0397)::GEOGRAPHY, 'bar',         ARRAY['speakeasy','cocktail'],         900,  TRUE),
  ('Indulge Bistro', '台北市信義區基隆路一段',   ST_MakePoint(121.5620, 25.0462)::GEOGRAPHY, 'bar',         ARRAY['wine_bar','bistro'],            700,  TRUE),
  ('Marquee Taipei', '台北市信義區松壽路22號',   ST_MakePoint(121.5560, 25.0475)::GEOGRAPHY, 'bar',         ARRAY['club','rooftop'],              1200,  TRUE)
ON CONFLICT DO NOTHING;
