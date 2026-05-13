import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { dbSchema } from './schema';
import { migrations } from './migrations';
import { LocalRecordingModel } from './models/LocalRecordingModel';
import { LocalUploadQueueModel } from './models/LocalUploadQueueModel';
import { ServerRecordingCacheModel } from './models/ServerRecordingCacheModel';

const adapter = new SQLiteAdapter({
  schema: dbSchema,
  migrations,
  jsi: true,
  onSetUpError: (error) => {
    console.error('[DB] 초기화 실패:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [LocalRecordingModel, LocalUploadQueueModel, ServerRecordingCacheModel],
});
