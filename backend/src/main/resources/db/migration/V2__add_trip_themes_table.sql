-- 기존 trips 테이블의 theme 데이터를 trip_themes 테이블로 마이그레이션

-- 1. trip_themes 테이블 생성
CREATE TABLE IF NOT EXISTS trip_themes (
    trip_id BIGINT NOT NULL,
    theme VARCHAR(50) NOT NULL,
    CONSTRAINT fk_trip_themes_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- 2. 기존 theme 데이터 마이그레이션 (theme 컬럼이 존재하는 경우)
INSERT INTO trip_themes (trip_id, theme)
SELECT id, theme FROM trips WHERE theme IS NOT NULL;

-- 3. trips 테이블에서 theme 컬럼 제거
ALTER TABLE trips DROP COLUMN IF EXISTS theme;

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_trip_themes_trip_id ON trip_themes(trip_id);
