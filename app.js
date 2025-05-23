// app.js – zeigt Titel + Veröffentlichungsdatum in der Übersicht

let comicData = [];

function getStorageKey(comic) {
  return `${comic.series || 'unknown'}_${comic.issue_number || comic.title}`;
}

function toggleReadByKey(key) {
  const card = document.querySelector(`.comic-card[data-key="${key}"]`);
  if (!card) return;

  if (card.classList.contains('read')) {
    localStorage.removeItem(key);
    card.classList.remove('read');
  } else {
    localStorage.setItem(key, 'read');
    card.classList.add('read');
  }
}

function renderComics() {
  const grid = document.getElementById('comicGrid');
  grid.innerHTML = '';

  comicData.forEach(c => {
    const card = document.createElement('div');
    card.className = 'comic-card';
    card.dataset.key = getStorageKey(c);
    if (localStorage.getItem(card.dataset.key)) card.classList.add('read');

    const badge = document.createElement('div');
    badge.className = 'read-badge';
    badge.textContent = 'Read';
    card.appendChild(badge);

    const cover = document.createElement('div');
    cover.className = 'comic-cover';
    cover.style.width = '100%';
    cover.style.aspectRatio = '2 / 3';
    cover.style.borderRadius = '4px';
    cover.style.backgroundImage = `url('${c.covers?.[0] || ''}')`;
    cover.style.backgroundSize = 'cover';
    cover.style.backgroundPosition = 'center';
    cover.addEventListener('click', () => toggleReadByKey(getStorageKey(c)));

    const title = document.createElement('div');
    title.className = 'comic-title';
    title.textContent = c.title;

    const date = document.createElement('div');
    date.className = 'comic-date';
    date.textContent = c.release_date || '';

    card.append(cover, title, date);
    grid.appendChild(card);
  });
}

fetch('./manifest.json')
  .then(res => res.json())
  .then(files => Promise.all(files.map(f => fetch(f).then(r => r.json()))))
  .then(results => {
    comicData = results.flat();
    renderComics();
  });
