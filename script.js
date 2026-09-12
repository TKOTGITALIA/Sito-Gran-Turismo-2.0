let currentGame = 'gt7';
let gt7Data = [];
let mfgtData = [];
const IMAGES_PATH = './Immagini/';

// Variabili di stato per il visore ingrandito (Lightbox)
let currentZoomImages = [];
let currentZoomIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadData();
  renderGrid();
});

async function loadData() {
  try {
    const [res1, res2] = await Promise.all([
      fetch('data.json').then(r => r.json()).catch(() => []),
      fetch('data2.json').then(r => r.json()).catch(() => [])
    ]);
    gt7Data = Array.isArray(res1) ? res1 : [];
    mfgtData = Array.isArray(res2) ? res2 : [];
    populateBrandFilter();
  } catch (error) {
    console.error('Errore durante il caricamento dei file JSON:', error);
  }
}

function getCurrentDataset() {
  return currentGame === 'gt7' ? gt7Data : mfgtData;
}

function setupEventListeners() {
  // Cambio scheda GT7 / MFGT
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentGame = e.target.dataset.game;
      populateBrandFilter();
      renderGrid();
    });
  });

  // Filtri e ricerca
  document.getElementById('searchInput').addEventListener('input', renderGrid);
  document.getElementById('brandFilter').addEventListener('change', renderGrid);

  // Chiusura modal dettagli auto
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('carModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('carModal')) closeModal();
  });

  // Eventi Visore Ingrandito (Zoom Lightbox)
  document.getElementById('zoomCloseBtn').addEventListener('click', closeZoomModal);
  document.getElementById('zoomPrevBtn').addEventListener('click', prevZoomImage);
  document.getElementById('zoomNextBtn').addEventListener('click', nextZoomImage);
  
  document.getElementById('zoomModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('zoomModal')) closeZoomModal();
  });

  // Navigazione tramite tastiera (Frecce Sinistra/Destra ed ESC)
  document.addEventListener('keydown', (e) => {
    const zoomModal = document.getElementById('zoomModal');
    if (zoomModal && zoomModal.classList.contains('open')) {
      if (e.key === 'ArrowLeft') prevZoomImage();
      if (e.key === 'ArrowRight') nextZoomImage();
      if (e.key === 'Escape') closeZoomModal();
    }
  });
}

function populateBrandFilter() {
  const brandSelect = document.getElementById('brandFilter');
  brandSelect.innerHTML = '<option value="">Tutte le marche</option>';

  const dataset = getCurrentDataset();
  const brands = [...new Set(dataset.map(car => car.marca).filter(Boolean))].sort();

  brands.forEach(brand => {
    const opt = document.createElement('option');
    opt.value = brand;
    opt.textContent = brand;
    brandSelect.appendChild(opt);
  });
}

// Restituisce la miniatura (PNG -> JPG -> Placeholder)
function getCarThumbnail(car) {
  if (Array.isArray(car.immagini) && car.immagini.length > 0) {
    const pngImg = car.immagini.find(img => img.toLowerCase().endsWith('.png'));
    if (pngImg) return `${IMAGES_PATH}${pngImg}`;

    const jpgImg = car.immagini.find(img => img.toLowerCase().endsWith('.jpg'));
    if (jpgImg) return `${IMAGES_PATH}${jpgImg}`;

    return `${IMAGES_PATH}${car.immagini[0]}`;
  }
  return car.immagine || 'https://via.placeholder.com/300x180/141418/ffffff?text=No+Image';
}

function renderGrid() {
  const container = document.getElementById('carsGrid');
  container.innerHTML = '';

  const searchVal = document.getElementById('searchInput').value.toLowerCase().trim();
  const brandVal = document.getElementById('brandFilter').value;

  let filtered = getCurrentDataset().filter(car => {
    const matchName = (car.nome || '').toLowerCase().includes(searchVal);
    const matchBrandText = (car.marca || '').toLowerCase().includes(searchVal);
    const matchSelectBrand = !brandVal || car.marca === brandVal;
    return (matchName || matchBrandText) && matchSelectBrand;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">Nessuna auto trovata.</p>';
    return;
  }

  filtered.forEach(car => {
    const card = document.createElement('div');
    card.className = 'car-card';
    card.innerHTML = `
      <img src="${getCarThumbnail(car)}" alt="${car.nome}">
      <div class="car-card-body">
        <div class="car-card-title">${car.nome}</div>
        <div class="car-card-sub">${car.marca || ''} ${car.anno ? '• ' + car.anno : ''}</div>
      </div>
    `;
    card.addEventListener('click', () => openModal(car));
    container.appendChild(card);
  });
}

function openModal(car) {
  const body = document.getElementById('modalContent');
  let specsHTML = '';

  if (currentGame === 'gt7') {
    const potenzaFull = [car['potenza kw'], car['potenza cv'], car['potenza bhp']].filter(Boolean).join(' - ');
    const coppiaFull = [car['coppia nm'], car['coppia kgfm'], car['coppia ft-lb']].filter(Boolean).join(' - ');
    const pesoFull = [car['peso kg'], car['peso lb']].filter(Boolean).join(' - ');

    specsHTML = `
      <div class="spec-list">
        <div class="spec-item"><span>PAESE</span><span>${car.paese || '-'}</span></div>
        <div class="spec-item"><span>ANNO</span><span>${car.anno || '-'}</span></div>
        <div class="spec-item"><span>PUNTI PRESTAZIONE</span><span>${car.pp || '-'}</span></div>
        <div class="spec-item"><span>ASPIRAZIONE</span><span>${car.aspirazione || '-'}</span></div>
        <div class="spec-item"><span>TRASMISSIONE</span><span>${car.trasmissione || '-'}</span></div>
        <div class="spec-item"><span>CILINDRATA</span><span>${car.cilindrata || '-'}</span></div>
        <div class="spec-item"><span>TIPO DI MOTORE</span><span>${car.tipo_motore || '-'}</span></div>
        <div class="spec-item"><span>POTENZA MASSIMA</span><span>${potenzaFull || '-'}</span></div>
        <div class="spec-item"><span>COPPIA MASSIMA</span><span>${coppiaFull || '-'}</span></div>
        <div class="spec-item"><span>PESO</span><span>${pesoFull || '-'}</span></div>
        <div class="spec-item"><span>PREZZO</span><span>${car.prezzo || '-'}</span></div>
        <div class="spec-item"><span>ACQUISTO</span><span>${car.acquisto || '-'}</span></div>
        <div class="spec-item"><span>CATEGORIA</span><span>${car.categoria || '-'}</span></div>
      </div>
    `;
  } else {
    specsHTML = `
      <div class="spec-list">
        <div class="spec-item"><span>PAESE</span><span>${car.paese || '-'}</span></div>
        <div class="spec-item"><span>TRASMISSIONE</span><span>${car.trasmissione || '-'}</span></div>
        <div class="spec-item"><span>VELOCITÀ</span><span>${car.velocita || '-'}</span></div>
        <div class="spec-item"><span>ACCELERAZIONE</span><span>${car.accelerazione || '-'}</span></div>
        <div class="spec-item"><span>FRENATA</span><span>${car.frenata || '-'}</span></div>
        <div class="spec-item"><span>STERZATA</span><span>${car.sterzata || '-'}</span></div>
        <div class="spec-item"><span>STABILITÀ</span><span>${car.stabilita || '-'}</span></div>
      </div>
    `;
  }

  // Prepara l'elenco delle immagini per la galleria e per lo Zoom
  const allImages = Array.isArray(car.immagini) ? car.immagini : [];
  const jpgImages = allImages.filter(img => img.toLowerCase().endsWith('.jpg'));
  
  // Utilizza le foto JPG per la galleria (o qualsiasi immagine se le JPG sono assenti)
  const galleryImages = jpgImages.length > 0 ? jpgImages : allImages;

  let galleryHTML = '';

  if (galleryImages.length > 0) {
    const imagesMarkup = galleryImages
      .map((img, idx) => `<img src="${IMAGES_PATH}${img}" alt="${car.nome}" data-index="${idx}">`)
      .join('');
    galleryHTML = `<div class="carousel-container">${imagesMarkup}</div>`;
  } else {
    const fallbackSrc = getCarThumbnail(car);
    galleryHTML = `<img src="${fallbackSrc}" alt="${car.nome}" style="cursor: pointer;" id="singleModalImage">`;
  }

  body.innerHTML = `
    ${galleryHTML}
    <h2>${car.nome}</h2>
    <div class="brand-name">${car.marca || ''} ${car.anno ? '• ' + car.anno : ''}</div>
    ${car.titolo ? `<p style="color: var(--accent-red); font-weight: 700; font-size: 0.9rem; margin-bottom: 15px;">${car.titolo}</p>` : ''}
    ${specsHTML}
    ${car.descrizione ? `<div class="car-desc" style="margin-top: 15px;">${car.descrizione}</div>` : ''}
    ${car.link ? `<div style="margin-top: 20px;"><a href="${car.link}" target="_blank" style="color: var(--accent-red); font-weight: 700; text-decoration: none;">Scheda Ufficiale &rarr;</a></div>` : ''}
  `;

  document.getElementById('carModal').classList.add('open');

  const carousel = body.querySelector('.carousel-container');
  if (carousel) carousel.scrollLeft = 0;

  // Imposta le immagini correnti per il visore di Zoom
  if (galleryImages.length > 0) {
    currentZoomImages = galleryImages.map(img => `${IMAGES_PATH}${img}`);
    
    // Associa il click su ogni immagine del carosello per aprire la vista ingrandita
    body.querySelectorAll('.carousel-container img').forEach(imgEl => {
      imgEl.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index, 10) || 0;
        openZoomModal(index);
      });
    });
  } else {
    const singleImg = body.querySelector('#singleModalImage');
    if (singleImg) {
      currentZoomImages = [singleImg.src];
      singleImg.addEventListener('click', () => openZoomModal(0));
    }
  }
}

function closeModal() {
  document.getElementById('carModal').classList.remove('open');
}

// --- LOGICA VISORE INGRANDITO (ZOOM LIGHTBOX) ---

function openZoomModal(index) {
  if (!currentZoomImages || currentZoomImages.length === 0) return;

  currentZoomIndex = index;
  updateZoomImage();

  const prevBtn = document.getElementById('zoomPrevBtn');
  const nextBtn = document.getElementById('zoomNextBtn');

  // Se c'è solo un'immagine, nasconde le frecce di scorrimento
  if (currentZoomImages.length <= 1) {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
  } else {
    prevBtn.style.display = 'block';
    nextBtn.style.display = 'block';
  }

  document.getElementById('zoomModal').classList.add('open');
}

function updateZoomImage() {
  const imgEl = document.getElementById('zoomImage');
  if (imgEl && currentZoomImages[currentZoomIndex]) {
    imgEl.src = currentZoomImages[currentZoomIndex];
  }
}

function prevZoomImage() {
  if (currentZoomImages.length <= 1) return;
  currentZoomIndex = (currentZoomIndex - 1 + currentZoomImages.length) % currentZoomImages.length;
  updateZoomImage();
}

function nextZoomImage() {
  if (currentZoomImages.length <= 1) return;
  currentZoomIndex = (currentZoomIndex + 1) % currentZoomImages.length;
  updateZoomImage();
}

function closeZoomModal() {
  document.getElementById('zoomModal').classList.remove('open');
}