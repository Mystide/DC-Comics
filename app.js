document.addEventListener('DOMContentLoaded', () => {
  const comics = [];
  const grid = document.getElementById('comicGrid');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const searchInput = document.getElementById('searchInput');
  const columnSelect = document.getElementById('columnSelect');
  const sortSelect = document.getElementById('sortSelect');
  const readFilterSelect = document.getElementById('readFilterSelect');
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsMenu = document.getElementById('settingsMenu');
  const infoDialog = document.getElementById('infoDialog');

  let comicData = [];

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '600px' });

  const toggleRead = title => {
    localStorage.getItem(title)
      ? localStorage.removeItem(title)
      : localStorage.setItem(title, 'read');
    updateProgress();
    renderComics(searchInput.value);
  };

  const openDialog = comic => {
    infoDialog.innerHTML = `
      <button onclick="document.getElementById('infoDialog').close()" style="position:absolute;top:8px;right:12px;background:transparent;border:none;font-size:1.5rem;color:#ccc;cursor:pointer;">&times;</button>
      <h2>${comic.title}</h2>
      <p><strong>Release:</strong> ${comic.release_date || '-'}</p>
      <p><strong>Event:</strong> ${comic.event || '-'}</p>
      <p><strong>Format:</strong> ${comic.format || ''} | ${comic.page_count || ''} pages</p>
      <p><strong>Writer:</strong> ${(comic.writer || []).join(', ')}</p>
      <p><strong>Artist:</strong> ${(comic.artist || []).join(', ')}</p>
      <p><strong>Characters:</strong> ${(comic.characters || []).join(', ')}</p>
      <p>${comic.description || ''}</p>
      <p><a href="${comic.url}" target="_blank">🔗 View on League of Comic Geeks</a></p>`;
    infoDialog.showModal();
  };

  const updateProgress = () => {
    const total = comicData.length;
    const read = comicData.filter(c => localStorage.getItem(c.title)).length;
    const percent = total ? ((read / total) * 100).toFixed(1) : 0;
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${read} / ${total} read (${percent}%)`;
  };

  const renderComics = (filter = '') => {
    const sort = sortSelect.value;
    const readFilter = readFilterSelect.value;
    grid.innerHTML = '';

    const filtered = comicData
      .filter(c => {
        const isRead = localStorage.getItem(c.title);
        if (readFilter === 'read' && !isRead) return false;
        if (readFilter === 'unread' && isRead) return false;

        const text = `${c.title} ${c.event} ${(c.characters || []).join(' ')} ${(c.writer || []).join(' ')} ${(c.artist || []).join(' ')}`.toLowerCase();
        return text.includes(filter.toLowerCase());
      })
      .sort((a, b) => sort === 'asc'
        ? (a.issue_number || 0) - (b.issue_number || 0)
        : (b.issue_number || 0) - (a.issue_number || 0)
      );

    filtered.forEach(c => {
      const card = document.createElement('div');
      card.className = 'comic-card';
      if (localStorage.getItem(c.title)) card.classList.add('read');

      const badge = document.createElement('div');
      badge.className = 'read-badge';
      badge.textContent = 'Read';
      card.appendChild(badge);

      const img = document.createElement('img');
      img.dataset.src = c.covers[0];
      img.alt = c.title;
      img.onload = () => img.classList.add('loaded');
      observer.observe(img);
      img.addEventListener('contextmenu', e => e.preventDefault());

      let pressTimer;
      let longPress = false;

      const startPress = () => {
        longPress = false;
        pressTimer = setTimeout(() => {
          longPress = true;
          toggleRead(c.title);
        }, 600);
      };

      const cancelPress = () => clearTimeout(pressTimer);

      img.addEventListener('mousedown', e => { if (e.button === 0) startPress(); });
      img.addEventListener('touchstart', startPress);
      img.addEventListener('mouseup', cancelPress);
      img.addEventListener('mouseleave', cancelPress);
      img.addEventListener('touchend', cancelPress);

      img.addEventListener('click', e => {
        if (longPress) return;
        e.preventDefault();
        openDialog(c);
      });

      const title = document.createElement('div');
      title.className = 'comic-title';
      title.textContent = c.title;

      card.append(img, title);
      grid.appendChild(card);
    });

    updateProgress();
  };

  settingsToggle.addEventListener('click', e => {
    e.stopPropagation();
    settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
  });

  document.addEventListener('click', e => {
    if (!settingsMenu.contains(e.target) && e.target !== settingsToggle) {
      settingsMenu.style.display = 'none';
    }
  });

  searchInput.addEventListener('input', () => renderComics(searchInput.value));
  sortSelect.addEventListener('change', () => renderComics(searchInput.value));
  readFilterSelect.addEventListener('change', () => renderComics(searchInput.value));
  columnSelect.addEventListener('change', e => {
    const value = e.target.value;
    grid.style.gridTemplateColumns = value === 'auto'
      ? 'repeat(auto-fill, minmax(160px, 1fr))'
      : `repeat(${value}, minmax(0, 1fr))`;
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', () => {
    scrollTopBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
  });

  fetch('./manifest.json')
    .then(res => res.json())
    .then(files => Promise.all(files.map(f => fetch(f).then(r => r.json()))))
    .then(results => {
      comicData = results.flat();
      renderComics();
    });
});
