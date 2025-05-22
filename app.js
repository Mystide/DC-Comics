// app.js

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

function toggleRead(title) {
  localStorage.getItem(title)
    ? localStorage.removeItem(title)
    : localStorage.setItem(title, 'read');
  updateProgress();
  renderComics(document.getElementById('searchInput').value);
}

function updateProgress() {
  const total = comicData.length;
  const read = comicData.filter(c => localStorage.getItem(c.title)).length;
  const percent = total ? ((read / total) * 100).toFixed(1) : 0;
  document.getElementById('progressBar').style.width = `${percent}%`;
  document.getElementById('progressText').textContent = `${read} / ${total} read (${percent}%)`;
}

function openDialog(comic) {
  document.getElementById('dialogTitle').textContent = comic.title;
  document.getElementById('dialogIssue').textContent = comic.issue_number || '-';
  document.getElementById('dialogDate').textContent = comic.release_date || '-';
  document.getElementById('infoDialog').showModal();
}

function renderComics(filter = '') {
  const sort = document.getElementById('sortSelect').value;
  const readFilter = document.getElementById('readFilterSelect').value;
  const grid = document.getElementById('comicGrid');
  grid.innerHTML = '';

  const filtered = comicData
    .filter(c => {
      const isRead = localStorage.getItem(c.title);
      if (readFilter === 'read' && !isRead) return false;
      if (readFilter === 'unread' && isRead) return false;
      const text = `${c.title} ${c.event} ${(c.characters || []).join(' ')} ${(c.writer || []).join(' ')} ${(c.artist || []).join(' ')}`.toLowerCase();
      return text.includes(filter.toLowerCase());
    })
    .sort((a, b) => {
      switch (sort) {
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'date-asc':
          return new Date(a.release_date || 0) - new Date(b.release_date || 0);
        case 'date-desc':
          return new Date(b.release_date || 0) - new Date(a.release_date || 0);
        default:
          return 0;
      }
    });

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
}

document.getElementById('settingsToggle').addEventListener('click', e => {
  e.stopPropagation();
  const menu = document.getElementById('settingsMenu');
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
});

document.addEventListener('click', e => {
  const menu = document.getElementById('settingsMenu');
  const toggle = document.getElementById('settingsToggle');
  if (!menu.contains(e.target) && e.target !== toggle) {
    menu.style.display = 'none';
  }
});

document.getElementById('searchInput').addEventListener('input', e => {
  renderComics(e.target.value);
});

document.getElementById('sortSelect').addEventListener('change', () => {
  renderComics(document.getElementById('searchInput').value);
});

document.getElementById('readFilterSelect').addEventListener('change', () => {
  renderComics(document.getElementById('searchInput').value);
});

document.getElementById('columnSelect').addEventListener('change', e => {
  const grid = document.getElementById('comicGrid');
  const value = e.target.value;
  grid.style.gridTemplateColumns = value === 'auto'
    ? 'repeat(auto-fill, minmax(160px, 1fr))'
    : `repeat(${value}, minmax(0, 1fr))`;
});

document.getElementById('scrollTopBtn').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.addEventListener('scroll', () => {
  const btn = document.getElementById('scrollTopBtn');
  btn.style.display = window.scrollY > 300 ? 'block' : 'none';
});

fetch('./manifest.json')
  .then(res => res.json())
  .then(files => Promise.all(files.map(f => fetch(f).then(r => r.json()))))
  .then(results => {
    comicData = results.flat();
    renderComics();
  });
