const CONFIG = {
  FOLDER_ID: '12U8kVm-TXr6y8nqQ0rog-CZRFV9jag_h',
  MAX_FILES_PER_UPLOAD: 30,
  MAX_BYTES_PER_FILE: 20 * 1024 * 1024,
  LIST_LIMIT: 200,
  EVENT_PREFIX: 'MK',
  ALLOWED_MIME_TYPES: {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/heic': ['heic'],
    'image/heif': ['heic', 'heif'],
    'image/webp': ['webp']
  }
};

function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('Math Kangaroo Photo Upload')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function uploadPhoto(file) {
  ensureConfigured();

  if (!file || typeof file.name !== 'string' || typeof file.mimeType !== 'string' || typeof file.base64 !== 'string') {
    throw new Error('Upload failed. Please check your internet connection and try again.');
  }

  var mimeType = normalizeMimeType(file.mimeType, file.name);
  if (!CONFIG.ALLOWED_MIME_TYPES[mimeType]) {
    throw new Error('Only JPG, JPEG, PNG, HEIC, and WebP images are allowed.');
  }

  var bytes = Utilities.base64Decode(file.base64);
  if (bytes.length > CONFIG.MAX_BYTES_PER_FILE) {
    throw new Error('Each image must be 20 MB or smaller.');
  }

  if (!hasAllowedImageSignature(bytes, mimeType)) {
    throw new Error('Only JPG, JPEG, PNG, HEIC, and WebP images are allowed.');
  }

  var folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
  var extension = getSafeExtension(file.name, mimeType);
  var safeOriginalName = sanitizeFilename(file.name || ('photo.' + extension));
  safeOriginalName = ensureExtension(safeOriginalName, extension);
  var fileName = buildUniqueFilename(folder, safeOriginalName);
  var blob = Utilities.newBlob(bytes, mimeType, fileName);
  var createdFile = folder.createFile(blob);

  createdFile.setName(fileName);
  createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return serializePhoto(createdFile);
}

function listPhotos() {
  ensureConfigured();

  var folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
  var files = folder.getFiles();
  var photos = [];

  while (files.hasNext()) {
    var file = files.next();
    if (isAllowedMimeType(file.getMimeType())) {
      photos.push(serializePhoto(file));
    }
  }

  photos.sort(function (a, b) {
    return b.createdTime - a.createdTime;
  });

  return photos.slice(0, CONFIG.LIST_LIMIT);
}

function serializePhoto(file) {
  var id = file.getId();
  var created = file.getDateCreated();

  return {
    id: id,
    name: file.getName(),
    mimeType: file.getMimeType(),
    sizeBytes: file.getSize(),
    createdTime: created.getTime(),
    uploadedAt: Utilities.formatDate(created, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
    thumbnailUrl: buildPublicThumbnailUrl(id),
    downloadUrl: buildPublicDownloadUrl(id),
    viewUrl: buildPublicViewUrl(id)
  };
}

function sanitizeFilename(name) {
  var safe = String(name || 'photo')
    .replace(/[\\\/\?%\*:|"<>#{}\[\]`^~]/g, '_')
    .replace(/[\x00-\x1F\x7F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();

  if (!safe) {
    safe = 'photo';
  }

  if (safe.length > 90) {
    var dot = safe.lastIndexOf('.');
    if (dot > 0 && dot < safe.length - 1) {
      var base = safe.slice(0, dot).slice(0, 70);
      var ext = safe.slice(dot).slice(0, 12);
      safe = base + ext;
    } else {
      safe = safe.slice(0, 90);
    }
  }

  return safe;
}

function hasAllowedImageSignature(bytes, mimeType) {
  if (!bytes || bytes.length < 12) {
    return false;
  }

  if (mimeType === 'image/jpeg') {
    return unsignedByte(bytes, 0) === 0xFF && unsignedByte(bytes, 1) === 0xD8 && unsignedByte(bytes, 2) === 0xFF;
  }

  if (mimeType === 'image/png') {
    return unsignedByte(bytes, 0) === 0x89 && unsignedByte(bytes, 1) === 0x50 && unsignedByte(bytes, 2) === 0x4E && unsignedByte(bytes, 3) === 0x47 &&
      unsignedByte(bytes, 4) === 0x0D && unsignedByte(bytes, 5) === 0x0A && unsignedByte(bytes, 6) === 0x1A && unsignedByte(bytes, 7) === 0x0A;
  }

  if (mimeType === 'image/webp') {
    return asciiAt(bytes, 0, 4) === 'RIFF' && asciiAt(bytes, 8, 4) === 'WEBP';
  }

  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    var box = asciiAt(bytes, 4, 4);
    var brand = asciiAt(bytes, 8, 4);
    var brands = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevm', 'mif1', 'msf1'];
    return box === 'ftyp' && brands.indexOf(brand) !== -1;
  }

  return false;
}

function unsignedByte(bytes, index) {
  return bytes[index] & 0xFF;
}

function asciiAt(bytes, start, length) {
  var text = '';
  for (var index = start; index < start + length && index < bytes.length; index += 1) {
    text += String.fromCharCode(unsignedByte(bytes, index));
  }
  return text;
}
function buildUniqueFilename(folder, safeOriginalName) {
  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
  var attempts = 0;
  var name;

  do {
    name = CONFIG.EVENT_PREFIX + '_' + timestamp + '_' + randomToken() + '_' + safeOriginalName;
    attempts += 1;
  } while (folder.getFilesByName(name).hasNext() && attempts < 10);

  return name;
}

function buildPublicDownloadUrl(id) {
  return 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(id);
}

function buildPublicThumbnailUrl(id) {
  return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w600';
}

function buildPublicViewUrl(id) {
  return 'https://drive.google.com/file/d/' + encodeURIComponent(id) + '/view';
}

function normalizeMimeType(mimeType, fileName) {
  var normalized = String(mimeType || '').toLowerCase();
  if (CONFIG.ALLOWED_MIME_TYPES[normalized]) {
    return normalized;
  }

  var extension = getExtension(fileName);
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'heic') return 'image/heic';
  if (extension === 'heif') return 'image/heif';
  if (extension === 'webp') return 'image/webp';

  return normalized;
}

function getSafeExtension(fileName, mimeType) {
  var extension = getExtension(fileName);
  var allowed = CONFIG.ALLOWED_MIME_TYPES[mimeType] || [];

  if (allowed.indexOf(extension) !== -1) {
    return extension === 'jpeg' ? 'jpg' : extension;
  }

  return allowed[0] || 'jpg';
}

function getExtension(fileName) {
  var match = String(fileName || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
}

function ensureExtension(fileName, extension) {
  var currentExtension = getExtension(fileName);
  var allowedExtensions = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp'];

  if (allowedExtensions.indexOf(currentExtension) !== -1) {
    return fileName.replace(/\.[^.]+$/, '.' + extension);
  }

  return fileName + '.' + extension;
}

function isAllowedMimeType(mimeType) {
  return Boolean(CONFIG.ALLOWED_MIME_TYPES[String(mimeType || '').toLowerCase()]);
}

function randomToken() {
  return Math.floor(Math.random() * 0x10000).toString(16).toUpperCase().padStart(4, '0');
}

function ensureConfigured() {
  if (!CONFIG.FOLDER_ID || CONFIG.FOLDER_ID === 'PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE') {
    throw new Error('Google Drive folder is not configured.');
  }
}



