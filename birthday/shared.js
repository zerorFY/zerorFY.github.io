(() => {
  const cfg = window.MAXWELL_CONFIG || {};
  const ready = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase?.createClient);
  const client = ready ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  const state = { client, ready, cfg };

  function safeName(name) {
    const ext = (name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const stem = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 42) || 'photo';
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${stem}.${ext}`;
  }

  async function listPhotos(limit = 200) {
    if (!client) return [];
    const { data, error } = await client
      .from(cfg.table)
      .select('id,storage_path,public_url,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(row => row.public_url).filter(Boolean);
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

  function subscribe(onInsert, onDelete) {
    if (!client) return () => {};
    const channel = client
      .channel('maxwell-birthday-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: cfg.table }, payload => onInsert?.(payload.new))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: cfg.table }, payload => onDelete?.(payload.old))
      .subscribe();
    return () => client.removeChannel(channel);
  }

  window.MaxwellPhotos = { ...state, listPhotos, uploadPhoto, subscribe };
})();
