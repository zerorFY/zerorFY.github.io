const test = require('node:test');
const assert = require('node:assert/strict');
const {
  deleteAllPhotos,
  getPhotoCount,
  uploadPhotoWithClient,
  startUsageSession,
  heartbeatUsageSession
} = require('./party-store.js');

function createFakeClient(calls, rows, storageObjects = [], storageError = null) {
  return {
    from(table) {
      return {
        async select() {
          calls.push(['select', table]);
          return { data: rows, error: null };
        },
        delete() {
          return {
            async in(column, ids) {
              calls.push(['delete.in', table, column, ids]);
              return { error: null };
            }
          };
        }
      };
    },
    storage: {
      from(bucket) {
        return {
          async list(prefix) {
            calls.push(['storage.list', bucket, prefix]);
            return { data: storageObjects, error: null };
          },
          async remove(paths) {
            calls.push(['storage.remove', bucket, paths]);
            return { error: storageError };
          }
        };
      }
    }
  };
}

const cfg = { table: 'birthday_photos', bucket: 'maxwell-birthday' };

test('deleteAllPhotos removes every bucket upload including orphaned objects before matching table rows', async () => {
  const calls = [];
  const client = createFakeClient(calls, [
    { id: 1, storage_path: 'uploads/a.jpg' },
    { id: 2, storage_path: 'uploads/b.jpg' }
  ], [{ name: 'a.jpg' }, { name: 'b.jpg' }, { name: 'orphan.jpg' }]);

  const result = await deleteAllPhotos(client, cfg);

  assert.deepEqual(calls, [
    ['select', 'birthday_photos'],
    ['storage.list', 'maxwell-birthday', 'uploads'],
    ['storage.remove', 'maxwell-birthday', ['uploads/a.jpg', 'uploads/b.jpg', 'uploads/orphan.jpg']],
    ['delete.in', 'birthday_photos', 'id', [1, 2]]
  ]);
  assert.deepEqual(result, { deleted: 2, storageDeleted: 3 });
});

test('deleteAllPhotos removes orphaned storage even when the table is empty', async () => {
  const calls = [];
  const result = await deleteAllPhotos(createFakeClient(calls, [], [{ name: 'orphan.jpg' }]), cfg);

  assert.deepEqual(result, { deleted: 0, storageDeleted: 1 });
  assert.deepEqual(calls, [
    ['select', 'birthday_photos'],
    ['storage.list', 'maxwell-birthday', 'uploads'],
    ['storage.remove', 'maxwell-birthday', ['uploads/orphan.jpg']]
  ]);
});

test('deleteAllPhotos does not delete rows when storage deletion fails', async () => {
  const calls = [];
  const expected = new Error('storage unavailable');

  await assert.rejects(
    deleteAllPhotos(createFakeClient(calls, [{ id: 1, storage_path: 'uploads/a.jpg' }], [{ name: 'a.jpg' }], expected), cfg),
    expected
  );
  assert.deepEqual(calls, [
    ['select', 'birthday_photos'],
    ['storage.list', 'maxwell-birthday', 'uploads'],
    ['storage.remove', 'maxwell-birthday', ['uploads/a.jpg']]
  ]);
});

test('getPhotoCount requests an exact head-only count', async () => {
  const calls = [];
  const client = {
    from(table) {
      return {
        async select(columns, options) {
          calls.push(['count', table, columns, options]);
          return { count: 17, error: null };
        }
      };
    }
  };

  assert.equal(await getPhotoCount(client, cfg), 17);
  assert.deepEqual(calls, [
    ['count', 'birthday_photos', '*', { count: 'exact', head: true }]
  ]);
});

test('upload rollback removes the new object and maps a concurrent database limit error', async () => {
  const calls = [];
  let uploadedPath;
  const client = {
    storage: {
      from(bucket) {
        return {
          async upload(path) {
            uploadedPath = path;
            calls.push(['upload', bucket, path]);
            return { error: null };
          },
          getPublicUrl(path) {
            return { data: { publicUrl: `https://example.test/${path}` } };
          },
          async remove(paths) {
            calls.push(['rollback', bucket, paths]);
            return { error: null };
          }
        };
      }
    },
    from() {
      return {
        insert() {
          return {
            select() {
              return {
                async single() {
                  return { data: null, error: { message: 'BIRTHDAY_PHOTO_LIMIT_REACHED' } };
                }
              };
            }
          };
        }
      };
    }
  };

  const file = { name: 'party.jpg', type: 'image/jpeg', size: 1200 };
  await assert.rejects(
    uploadPhotoWithClient(file, client, { ...cfg, maxUploadMb: 18 }),
    error => error.code === 'PHOTO_LIMIT_REACHED'
  );
  assert.match(uploadedPath, /^uploads\//);
  assert.deepEqual(calls.at(-1), ['rollback', 'maxwell-birthday', [uploadedPath]]);
});

test('usage session wrappers call only the two scoped RPC functions', async () => {
  const calls = [];
  const client = {
    async rpc(name, params) {
      calls.push([name, params]);
      return { error: null };
    }
  };

  await startUsageSession('session-1', 'opening', client);
  await heartbeatUsageSession('session-1', 30, 'spider', client);

  assert.deepEqual(calls, [
    ['birthday_usage_start', { p_session_id: 'session-1', p_scene: 'opening' }],
    ['birthday_usage_heartbeat', {
      p_session_id: 'session-1',
      p_duration_seconds: 30,
      p_scene: 'spider'
    }]
  ]);
});
