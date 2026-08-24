const test = require('node:test');
const assert = require('node:assert/strict');
const { deleteAllPhotos } = require('./party-store.js');

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
