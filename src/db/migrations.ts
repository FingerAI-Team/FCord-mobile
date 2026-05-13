import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

// 초기 스키마 — 마이그레이션 없음
// 향후 컬럼 추가 시 여기에 addColumns() 항목 추가
export const migrations = schemaMigrations({ migrations: [] });
