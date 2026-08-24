(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BirthdayPartyStore = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  const cfg = root?.BIRTHDAY_DEMO_CONFIG || {};
  const ready = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && root?.supabase?.createClient);
  const client = ready ? root.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  function safeName(name) {
    const ext = (name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const stem = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 42) || 'photo';
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${stem}.${ext}`;
  }

  async function listPhotoRows(activeClient = client, activeCfg = cfg, limit = 200) {
    if (!activeClient) return [];
    const { data, error } = await activeClient
      .from(activeCfg.table)
      .select('id,storage_path,public_url,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  async function listPhotos(limit = 200) {
    return (await listPhotoRows(client, cfg, limit)).map(row => row.public_url).filter(Boolean);
  }

  async function uploadPhoto(file) {
    if (!client) throw new Error('PHOTO_BACKEND_NOT_CONFIGURED');
    const maxBytes = (cfg.maxUploadMb || 18) * 1024 * 1024;
    if (!file?.type?.startsWith('image/')) throw new Error('NOT_AN_IMAGE');
    if (file.size > maxBytes) throw new Error('FILE_TOO_LARGE');

    const path = `uploads/${safeName(file.name)}`;
    const { error: uploadError } = await client.storage.from(cfg.bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined
    });
    if (uploadError) throw uploadError;

    const { data: publicData } = client.storage.from(cfg.bucket).getPublicUrl(path);
    const publicUrl = publicData?.publicUrl;
    if (!publicUrl) throw new Error('NO_PUBLIC_URL');

    const { data: row, error: insertError } = await client
      .from(cfg.table)
      .insert({ storage_path: path, public_url: publicUrl })
      .select('id,storage_path,public_url,created_at')
      .single();
    if (insertError) throw insertError;
    return row;
  }

  async function deleteAllPhotos(activeClient = client, activeCfg = cfg) {
    if (!activeClient) throw new Error('PHOTO_BACKEND_NOT_CONFIGURED');
    const { data, error: selectError } = await activeClient
      .from(activeCfg.table)
      .select('id,storage_path');
    if (selectError) throw selectError;

    const rows = data || [];
    const storage = activeClient.storage.from(activeCfg.bucket);
    const storagePaths = [];
    const pageSize = 100;
    for (let offset = 0; ; offset += pageSize) {
      const { data: objects, error: listError } = await storage.list('uploads', {
        limit: pageSize,
        offset,
        sortBy: { column: 'name', order: 'asc' }
      });
      if (listError) throw listError;
      const page = objects || [];
      storagePaths.push(...page.map(object => object?.name ? `uploads/${object.name}` : '').filter(Boolean));
      if (page.length < pageSize) break;
    }

    if (storagePaths.length) {
      const { error: storageError } = await storage.remove(storagePaths);
      if (storageError) throw storageError;
    }

    if (rows.length) {
      const ids = rows.map(row => row.id);
      const { error: deleteError } = await activeClient.from(activeCfg.table).delete().in('id', ids);
      if (deleteError) throw deleteError;
    }
    return { deleted: rows.length, storageDeleted: storagePaths.length };
  }

  function subscribe(onInsert, onDelete) {
    if (!client) return () => {};
    const channel = client
      .channel('birthday-demo-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: cfg.table }, payload => onInsert?.(payload.new))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: cfg.table }, payload => onDelete?.(payload.old))
      .subscribe();
    return () => client.removeChannel(channel);
  }

  return { client, ready, cfg, safeName, listPhotoRows, listPhotos, uploadPhoto, deleteAllPhotos, subscribe };
});
