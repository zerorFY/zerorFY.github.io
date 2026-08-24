window.BIRTHDAY_DEMO_CONFIG = {
  // Agent: fill these before deploying. Keep the anon key public; never put a service_role key in frontend code.
  supabaseUrl: "https://jcwwmgipbnzzdnanbdqu.supabase.co",
  supabaseAnonKey: "sb_publishable__9nexu_yZbToQstkdPGmPA_X0ftYEtb",
  bucket: "maxwell-birthday",
  table: "birthday_photos",
  publicBasePath: "/birthday-demo/",
  uploadPath: "/birthday-demo-upload/",
  rotationMs: 2800,
  maxVisiblePhotos: 5,
  maxPhotos: 20,
  maxUploadMb: 18
};
