(() => {
  const api = window.BirthdayPartyStore;
  const capacity = window.BirthdayPhotoCapacity;
  const input = document.getElementById('photoInput');
  const warning = document.getElementById('backendWarning');
  const title = document.getElementById('statusTitle');
  const count = document.getElementById('countLabel');
  const text = document.getElementById('statusText');
  const bar = document.getElementById('progressBar');
  const grid = document.getElementById('previewGrid');
  const endPartyBtn = document.getElementById('endPartyBtn');
  const endPartyDialog = document.getElementById('endPartyDialog');
  const confirmEndPartyBtn = document.getElementById('confirmEndPartyBtn');
  const limitNotice = document.getElementById('photoLimitNotice');

  if (!api?.ready) warning.hidden = false;

  function previewFor(file) {
    const node = document.createElement('div');
    node.className = 'preview';
    const img = document.createElement('img');
    img.alt = file.name;
    const mark = document.createElement('span');
    mark.className = 'mark'; mark.textContent = '…';
    node.append(img, mark); grid.prepend(node);
    const url = URL.createObjectURL(file);
    img.src = url; img.onload = () => URL.revokeObjectURL(url);
    return { node, mark };
  }

  input.addEventListener('change', async () => {
    const files = [...input.files].filter(f => f.type.startsWith('image/'));
    input.value = '';
    if (!files.length) return;
    limitNotice.hidden = true;
    count.textContent = `${files.length} selected`;
    if (!api?.ready) {
      title.textContent = 'Backend not ready';
      text.textContent = 'The page layout is ready, but Agent must configure Supabase before phone uploads can reach the computer.';
      return;
    }

    let currentCount;
    try {
      currentCount = await api.getPhotoCount();
    } catch (err) {
      console.error(err);
      title.textContent = 'Could not check photo limit';
      text.textContent = 'Please tap UPLOAD PHOTOS and try again.';
      return;
    }

    const plan = capacity.planPhotoBatch(currentCount, files, api.cfg.maxPhotos || 20);
    if (plan.limitReached) limitNotice.hidden = false;
    if (!plan.accepted.length) {
      title.textContent = 'Photo limit reached';
      count.textContent = `${currentCount} of ${api.cfg.maxPhotos || 20} photos`;
      text.textContent = 'End the party to clear the current photos before uploading more.';
      return;
    }

    title.textContent = 'Uploading…'; text.textContent = 'Keep this page open for a moment.'; bar.style.width = '0%';
    let done = 0, failed = 0, limitHit = false;
    for (const file of plan.accepted) {
      const ui = previewFor(file);
      try {
        await api.uploadPhoto(file);
        ui.node.classList.add('done'); ui.mark.textContent = '✓'; done++;
      } catch (err) {
        console.error(err);
        ui.node.classList.add('fail'); ui.mark.textContent = '!';
        if (err?.code === 'PHOTO_LIMIT_REACHED') {
          limitHit = true;
          limitNotice.hidden = false;
        } else {
          failed++;
        }
      }
      bar.style.width = `${Math.round(((done + failed + (limitHit ? 1 : 0)) / plan.accepted.length) * 100)}%`;
      count.textContent = `${done} uploaded${failed ? ` · ${failed} failed` : ''}`;
      if (limitHit) break;
    }
    if (limitHit || plan.limitReached) {
      title.textContent = 'Photo limit reached';
      text.textContent = `${done} photo${done === 1 ? '' : 's'} uploaded. This demo supports up to 20 photos.`;
    } else {
      title.textContent = failed ? 'Finished with errors' : 'Uploaded!';
      text.textContent = failed ? 'Successful photos are already on the party screen. You can retry failed ones.' : 'Photos are live on the party screen. Add more whenever you want.';
    }
  });

  endPartyBtn.addEventListener('click', () => endPartyDialog.showModal());

  confirmEndPartyBtn.addEventListener('click', async () => {
    confirmEndPartyBtn.disabled = true;
    endPartyBtn.disabled = true;
    title.textContent = 'Ending party…';
    text.textContent = 'Deleting every uploaded party photo.';
    try {
      const result = await api.deleteAllPhotos();
      grid.replaceChildren();
      count.textContent = '0 photos';
      bar.style.width = '0%';
      title.textContent = 'Party ended';
      text.textContent = `${result.deleted} party photo${result.deleted === 1 ? '' : 's'} permanently deleted.`;
      limitNotice.hidden = true;
      endPartyDialog.close();
    } catch (err) {
      console.error(err);
      title.textContent = 'Could not end party';
      text.textContent = 'Some photos may remain. Tap END PARTY to retry.';
      endPartyDialog.close();
    } finally {
      confirmEndPartyBtn.disabled = false;
      endPartyBtn.disabled = false;
    }
  });
})();
