// Este arquivo contém todas as funções principais do seu aplicativo.
// Ele depende de 'config.js' (para variáveis globais e referências DOM)
// ter sido carregado antes em index.html.

/**
 * Lógica para alternar entre as abas do aplicativo
 * @param {string} tabId - O ID da aba a ser mostrada (ex: 'dashboard-tab', 'create-save-tab').
 */
function showTab(tabId) {
    // Oculta todos os conteúdos das abas
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    // Desativa todos os botões das abas
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Ativa o conteúdo da aba selecionada
    document.getElementById(tabId).classList.add('active');
    // Ativa o botão correspondente à aba selecionada
    document.querySelector(`.tab-button[data-tab="${tabId.replace('-tab', '')}"]`).classList.add('active');

    // Chamadas de atualização para garantir que todas as abas estejam corretas
    // NOTA: applyTheme, updateFolderSelects, updateSavedTagsList já são chamadas
    // no DOMContentLoaded em main.js. Aqui, podemos chamá-las novamente se houver
    // alguma mudança de estado que afete múltiplos elementos visuais ao trocar de aba.
    // Para simplificar e evitar redundância excessiva, as chamadas mais abrangentes ficam no DOMContentLoaded.
    // No entanto, para garantir que os elementos das abas sempre reflitam o estado atual, mantemos.
    applyTheme(); // Garante que o tema seja aplicado corretamente a elementos após trocar de aba
    updateFolderSelects(); // Atualiza os selects de pasta e a lista de pastas
    updateSavedTagsList(); // Atualiza os datalists de tags

    // Funções específicas de renderização por aba
    if (tabId === 'folders-items-tab') {
        searchItems(); // Usa searchItems para renderizar a lista de itens aplicando filtros atuais
    } else if (tabId === 'dashboard-tab') {
        updateDashboard(); // Atualiza todas as estatísticas do dashboard
    }
}

/**
 * Função auxiliar para extrair o ID de um vídeo de várias plataformas.
 * @param {string} url - A URL completa do vídeo.
 * @param {string} type - O tipo de plataforma (ex: 'youtube', 'dailymotion', 'tiktok', 'kwai', 'facebook').
 * @returns {string|null} O ID do vídeo ou null se não for encontrado.
 */
function getVideoIdFromUrl(url, type) {
    if (!url) return null;

    if (type === 'youtube') {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^#\&\?]*).*/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } else if (type === 'dailymotion') {
        const regex = /(?:dailymotion\.com\/(?:video|embed)\/|dai\.ly\/)([a-zA-Z0-9]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } else if (type === 'tiktok') {
        const regex = /(?:tiktok\.com\/@(?:[a-zA-Z0-9_]+\/video|v)\/)([0-9]+)/;
        const match = regex.exec(url);
        return match ? match[1] : null;
    } else if (type === 'kwai') {
        const regex = /(?:kwai\.com\/(?:photo|video)\/)([0-9]+)/;
        const match = regex.exec(url);
        return match ? match[1] : null;
    } else if (type === 'facebook') {
        return url;
    }
    return null;
}

/**
 * Função para atualizar os dados e a renderização do Dashboard.
 */
function updateDashboard() {
    dashboardTotalItems.textContent = items.length;

    const itemsByTypeCounts = items.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
    }, {});
    dashboardItemsByType.innerHTML = '';
    if (Object.keys(itemsByTypeCounts).length > 0) {
        for (const type in itemsByTypeCounts) {
            const typeName = window.translations[currentLanguage][`${type}Type`] || type;
            dashboardItemsByType.innerHTML += `<li><span>${typeName}:</span> <span>${itemsByTypeCounts[type]}</span></li>`;
        }
    } else {
        dashboardItemsByType.innerHTML = `<li><span>${window.translations[currentLanguage]['dataPlaceholder']}</span></li>`;
    }

    dashboardTotalFolders.textContent = folders.length;

    const itemsByFolderCounts = items.reduce((acc, item) => {
        const folderName = item.folder || window.translations[currentLanguage]['noFolderAssigned'];
        acc[folderName] = (acc[folderName] || 0) + 1;
        return acc;
    }, {});
    dashboardItemsByFolder.innerHTML = '';
    if (Object.keys(itemsByFolderCounts).length > 0) {
        const sortedFolders = Object.entries(itemsByFolderCounts).sort(([nameA, countA], [nameB, countB]) => {
            if (countB !== countA) return countB - countA;
            return nameA.localeCompare(nameB);
        });
        sortedFolders.forEach(([folderName, count]) => {
            dashboardItemsByFolder.innerHTML += `<li><span>${folderName}:</span> <span>${count}</span></li>`;
        });
    } else {
        dashboardItemsByFolder.innerHTML = `<li><span>${window.translations[currentLanguage]['dataPlaceholder']}</span></li>`;
    }
    
    dashboardTotalTags.textContent = savedTags.length;

    const tagCounts = {};
    items.forEach(item => {
        if (item.tags) {
            item.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });
    const sortedTags = Object.entries(tagCounts).sort(([, a], [, b]) => b - a).slice(0, 5);
    dashboardTopTags.innerHTML = '';
    if (sortedTags.length > 0) {
        sortedTags.forEach(([tag, count]) => {
            dashboardTopTags.innerHTML += `<li><span>${tag}:</span> <span>${count}</span></li>`;
        });
    } else {
        dashboardTopTags.innerHTML = `<li><span>${window.translations[currentLanguage]['dataPlaceholder']}</span></li>`;
    }

    const ratingCounts = items.reduce((acc, item) => {
        const rating = item.rating !== undefined ? item.rating : 0;
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
    }, {});
    dashboardItemsByRating.innerHTML = '';
    const sortedRatings = Object.keys(ratingCounts).sort((a, b) => b - a);
    if (sortedRatings.length > 0) {
        sortedRatings.forEach(rating => {
            const displayRating = parseInt(rating) === 0 
                ? window.translations[currentLanguage]['noRating'] 
                : '★'.repeat(parseInt(rating)) + (parseInt(rating) === 1 ? ` (${window.translations[currentLanguage]['star']})` : ` (${window.translations[currentLanguage]['stars']})`);
            dashboardItemsByRating.innerHTML += `<li><span>${displayRating}:</span> <span>${ratingCounts[rating]}</span></li>`;
        });
    } else {
        dashboardItemsByRating.innerHTML = `<li><span>${window.translations[currentLanguage]['dataPlaceholder']}</span></li>`;
    }

    dashboardCurrentTheme.textContent = theme === 'light' ? 'Light' : 'Dark';
    dashboardCurrentLanguage.textContent = currentLanguage;

    const allVideoAccesses = [];
    items.filter(item => item.type === 'video' && item.accessHistory && item.accessHistory.length > 0).forEach(videoItem => {
        videoItem.accessHistory.forEach(timestamp => {
            allVideoAccesses.push({
                item: videoItem,
                timestamp: timestamp
            });
        });
    });

    allVideoAccesses.sort((a, b) => b.timestamp - a.timestamp);
    const lastAccessedVideos = allVideoAccesses.slice(0, 5);

    dashboardLastAccessedItems.innerHTML = '';
    if (lastAccessedVideos.length > 0) {
        lastAccessedVideos.forEach(access => {
            const accessDate = new Date(access.timestamp).toLocaleDateString(currentLanguage, { day: '2-digit', month: '2-digit', year: 'numeric' });
            const accessTime = new Date(access.timestamp).toLocaleTimeString(currentLanguage, { hour: '2-digit', minute: '2-digit' });
            const videoId = getVideoIdFromUrl(access.item.url, access.item.type);

            dashboardLastAccessedItems.innerHTML += `
                <li>
                    <div class="item-info-row">
                        <img src="${access.item.metadata.image}" alt="Thumb" class="item-thumbnail" onerror="this.src='https://placehold.co/40?text=No+Preview'">
                        <span class="truncate">${access.item.metadata.title}</span>
                    </div>
                    <span class="text-xs text-gray-500 flex-shrink-0">${window.translations[currentLanguage]['accessedOn']} ${accessDate} ${accessTime}</span>
                    <button class="copy-id-btn" data-video-id="${videoId || access.item.url}" title="${window.translations[currentLanguage]['copyIdBtn']}">
                        ${window.translations[currentLanguage]['copyIdBtn']}
                    </button>
                </li>`;
        });
    } else {
        dashboardLastAccessedItems.innerHTML = `<li><span>${window.translations[currentLanguage]['dataPlaceholder']}</span></li>`;
    }

    const videoAccessCounts = {};
    items.filter(item => item.type === 'video').forEach(videoItem => {
        videoAccessCounts[videoItem.id] = (videoItem.accessHistory ? videoItem.accessHistory.length : 0);
    });
    const sortedMostAccessedVideos = Object.entries(videoAccessCounts)
        .map(([id, count]) => {
            const item = items.find(i => i.id == id);
            return { item, count };
        })
        .filter(entry => entry.item && entry.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    dashboardMostAccessedVideos.innerHTML = '';
    if (sortedMostAccessedVideos.length > 0) {
        sortedMostAccessedVideos.forEach(entry => {
            const videoId = getVideoIdFromUrl(entry.item.url, entry.item.type);
            dashboardMostAccessedVideos.innerHTML += `
                <li>
                    <div class="item-info-row">
                        <img src="${entry.item.metadata.image}" alt="Thumb" class="item-thumbnail" onerror="this.src='https://placehold.co/40?text=No+Preview'">
                        <span class="truncate">${entry.item.metadata.title}:</span> <span class="flex-shrink-0">${entry.count} ${window.translations[currentLanguage]['accesses']}</span>
                    </div>
                    <button class="copy-id-btn" data-video-id="${videoId || entry.item.url}" title="${window.translations[currentLanguage]['copyIdBtn']}">
                        ${window.translations[currentLanguage]['copyIdBtn']}
                    </button>
                </li>`;
        });
    } else {
        dashboardMostAccessedVideos.innerHTML = `<li><span>${window.translations[currentLanguage]['dataPlaceholder']}</span></li>`;
    }

    document.querySelectorAll('.dashboard-list .copy-id-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const videoIdOrUrl = e.target.dataset.videoId;
            if (videoIdOrUrl) {
                navigator.clipboard.writeText(videoIdOrUrl)
                    .then(() => showCustomModal(`ID/URL copied: ${videoIdOrUrl}`, window.translations[currentLanguage]['okBtn']))
                    .catch(err => {
                        console.error('Failed to copy ID/URL:', err);
                        showCustomModal(window.translations[currentLanguage]['copyFailed'], window.translations[currentLanguage]['okBtn']);
                    });
                showTab('folders-items-tab');
                searchQueryInput.value = videoIdOrUrl;
                searchItems();
            }
        });
    });
}


/**
 * Função para aplicar o tema (claro/escuro) em todo o aplicativo.
 */
function applyTheme() {
  document.body.className = theme;
  toggleThemeBtn.textContent = `Toggle ${theme === 'light' ? 'Dark' : 'Light'} Theme`;
  localStorage.setItem('theme', theme);
  
  const appTitle = document.querySelector('h1[data-i18n="appTitle"]');
  const settingsTitle = document.querySelector('h2[data-i18n="settingsTitle"]');
  const languageLabel = document.querySelector('label[data-i18n="languageLabel"]');
  const manageTagsTitle = document.querySelector('h3[data-i18n="manageTagsTitle"]');
  const addNewItemTitle = document.querySelector('#create-save-tab h2[data-i18n="addNewItemTitle"]');
  const createNewFolderTitle = document.querySelector('#create-save-tab h2[data-i18n="createNewFolderTitle"]');
  const foldersTitle = document.querySelector('#folders-items-tab h2 span[data-i18n="foldersTitle"]');
  const searchItemsTitle = document.querySelector('#folders-items-tab h2[data-i18n="searchItemsTitle"]');
  const savedItemsTitle = document.querySelector('#folders-items-tab h2[data-i18n="savedItemsTitle"]');
  const dashboardTitle = document.querySelector('#dashboard-tab h2[data-i18n="dashboardTitle"]');
  const dashboardContent = document.querySelector('#dashboard-tab p[data-i18n="dashboardContent"]');

  const textElements = [
    appTitle, settingsTitle, languageLabel, manageTagsTitle,
    addNewItemTitle, createNewFolderTitle, foldersTitle,
    searchItemsTitle, savedItemsTitle, dashboardTitle, dashboardContent
  ];

  textElements.forEach(element => {
    if (element) {
      if (theme === 'light') {
        element.classList.remove('text-white');
        element.classList.add('text-gray-800');
      } else {
        element.classList.remove('text-gray-800');
        element.classList.add('text-white');
      }
    }
  });

  const previewContainer = document.getElementById('preview-container');
  const previewTitle = document.getElementById('preview-title');
  const previewDescription = document.getElementById('preview-description');

  if (previewContainer) {
    if (theme === 'light') {
      previewContainer.classList.remove('bg-white/10');
      previewContainer.classList.add('bg-white/40');
      previewTitle.classList.remove('text-white');
      previewTitle.classList.add('text-gray-800');
      previewDescription.classList.remove('text-gray-200');
      previewDescription.classList.add('text-gray-600');
    } else {
      previewContainer.classList.remove('bg-white/40');
      previewContainer.classList.add('bg-white/10');
      previewTitle.classList.remove('text-gray-800');
      previewTitle.classList.add('text-white');
      previewDescription.classList.remove('text-gray-600');
      previewDescription.classList.add('text-gray-200');
    }
  }

  const modalContents = document.querySelectorAll('.modal-content');
  modalContents.forEach(modal => {
    const labels = modal.querySelectorAll('.modal-input-group label');
    const inputs = modal.querySelectorAll('.modal-input-group input, .modal-input-group select');
    const closeBtn = modal.querySelector('.modal-close-btn');

    if (modal.id === 'video-player-modal' ) {
        if (theme === 'light') {
            closeBtn.style.color = 'white';
            closeBtn.onmouseover = () => closeBtn.style.backgroundColor = 'rgba(255,255,255,0.2)';
            closeBtn.onmouseout = () => closeBtn.style.backgroundColor = 'rgba(0,0,0,0.5)';
        } else {
            closeBtn.style.color = 'white';
            closeBtn.onmouseover = () => closeBtn.style.backgroundColor = 'rgba(255,255,255,0.2)';
            closeBtn.onmouseout = () => closeBtn.style.backgroundColor = 'rgba(0,0,0,0.5)';
        }
    }
    else if (theme === 'light') {
        modal.style.backgroundColor = '#fff';
        modal.style.color = '#333';
        modal.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';
        closeBtn.style.color = '#888';
        closeBtn.onmouseover = () => closeBtn.style.color = '#333';
        closeBtn.onmouseout = () => closeBtn.style.color = '#888';

        labels.forEach(label => label.style.color = '#333');
        inputs.forEach(input => {
            input.style.backgroundColor = '#f0f0f0';
            input.style.borderColor = '#ddd';
            input.style.color = '#333';
        });
    } else {
        modal.style.backgroundColor = '#2a2a2a';
        modal.style.color = '#e0e7ff';
        modal.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.6)';
        closeBtn.style.color = '#bbb';
        closeBtn.onmouseover = () => closeBtn.style.color = '#fff';
        closeBtn.onmouseout = () => closeBtn.style.color = '#bbb';

        labels.forEach(label => label.style.color = '#e0e7ff');
        inputs.forEach(input => {
            input.style.backgroundColor = '#3a3a3a';
            input.style.borderColor = '#555';
            input.style.color = '#e0e7ff';
        });
    }
  });
  document.querySelectorAll('.tag-item').forEach(tagItem => {
      if (theme === 'light') {
          tagItem.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
          tagItem.style.color = '#333';
      } else {
          tagItem.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          tagItem.style.color = 'white';
      }
  });
  document.querySelectorAll('.icon-svg').forEach(icon => {
      if (theme === 'light') {
          icon.style.filter = 'invert(0)';
      } else {
          icon.style.filter = 'invert(1)';
      }
  });

  document.querySelectorAll('.dashboard-card').forEach(card => {
      if (theme === 'light') {
          card.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
          card.style.borderColor = 'rgba(255, 255, 255, 0.7)';
          card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)';
          card.style.color = '#333';
          card.querySelector('h3').style.color = '#007bff';
      } else {
          card.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
          card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          card.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
          card.style.color = '#e0e7ff';
          card.querySelector('h3').style.color = '#4ecdc4';
      }
  });
}

/**
 * Função para aplicar o idioma selecionado em toda a interface.
 * @param {string} lang - O código do idioma (ex: 'pt-BR', 'en', 'es').
 */
function applyLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('language', currentLanguage);

  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (window.translations[currentLanguage] && window.translations[currentLanguage][key]) {
      element.textContent = window.translations[currentLanguage][key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (window.translations[currentLanguage] && window.translations[currentLanguage][key]) {
      element.placeholder = window.translations[currentLanguage][key];
    }
  });

  toggleThemeBtn.textContent = window.translations[currentLanguage]['toggleDarkThemeBtn'];
  
  toggleFoldersBtn.textContent = foldersListContainer.classList.contains('hidden') 
      ? window.translations[currentLanguage]['expandFoldersBtn']
      : window.translations[currentLanguage]['collapseFoldersBtn'];

  updateFolderSelects();
  updateSavedTagsList();
  renderItems();
  updateDashboard();
}

/**
 * Função para atualizar as opções de pastas nos selects e renderizar a lista de pastas.
 */
function updateFolderSelects() {
  const createOptionWithSVG = (value, textKey, iconPath) => {
    const option = document.createElement('option');
    option.value = value;
    option.setAttribute('data-i18n', textKey);
    option.innerHTML = `<img src="${iconPath}" alt="" class="icon-svg inline-block"> ${window.translations[currentLanguage][textKey]}`;
    return option;
  };

  const folderIconOptions = [
    { value: "svg/tiktok.svg", textKey: "iconTikTok" },
    { value: "svg/kwai.svg", textKey: "iconKwai" },
    { value: "svg/facebook.svg", textKey: "iconFacebook" },
    { value: "svg/instagram.svg", textKey: "iconInstagram" },
    { value: "svg/youtube.svg", textKey: "iconYouTube" },
    { value: "svg/dailymotion.svg", textKey: "iconDailymotion" },
    { value: "svg/folder.svg", textKey: "iconFolder" },
    { value: "svg/link.svg", textKey: "iconLink" }
  ];

  itemFolderSelect.innerHTML = '';
  folders.forEach(folder => {
    const option = document.createElement('option');
    option.value = folder.name;
    option.innerHTML = `<img src="${folder.icon}" alt="" class="icon-svg inline-block"> ${folder.name}`;
    itemFolderSelect.appendChild(option);
  });
  
  searchFolderSelect.innerHTML = `<option value="all" data-i18n="allFolders">${window.translations[currentLanguage]['allFolders']}</option>`;
  folders.forEach(folder => {
    const option = document.createElement('option');
    option.value = folder.name;
    option.innerHTML = `<img src="${folder.icon}" alt="" class="icon-svg inline-block"> ${folder.name}`;
    searchFolderSelect.appendChild(option);
  });
  
  editItemFolderSelect.innerHTML = `<option value="">${window.translations[currentLanguage]['noFolder']}</option>`;
  folders.forEach(folder => {
    const option = document.createElement('option');
    option.value = folder.name;
    option.innerHTML = `<img src="${folder.icon}" alt="" class="icon-svg inline-block"> ${folder.name}`;
    editItemFolderSelect.appendChild(option);
  });
  
  foldersList.innerHTML = `<button id="all-items-btn" class="px-2 sm:px-3 py-1 sm:py-2 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg text-white font-semibold hover:from-gray-700 hover:to-gray-900" data-i18n="allItemsBtn">${window.translations[currentLanguage]['allItemsBtn']}</button>`;
  folders.forEach(folder => {
      const itemCount = items.filter(item => item.folder === folder.name).length;
      const folderButtonHtml = `
          <div class="flex items-center gap-1 relative">
              <button class="folder-btn px-2 sm:px-3 py-1 sm:py-2 ${folder.color} rounded-lg text-white font-semibold hover:filter hover:brightness-110" data-folder="${folder.name}">
                  <img src="${folder.icon}" alt="" class="icon-svg inline-block"> ${folder.name} (${itemCount} ${window.translations[currentLanguage]['itemsInFolder']})
              </button>
              <button class="edit-folder-btn folder-action-btn edit" data-folder-name="${folder.name}" data-i18n="editBtn">${window.translations[currentLanguage]['editBtn']}</button>
          </div>`;
      foldersList.innerHTML += folderButtonHtml;
  });

  localStorage.setItem('folders', JSON.stringify(folders));

  document.querySelectorAll('.folder-btn').forEach(btn => {
    btn.onclick = () => {
      selectedFolder = btn.dataset.folder;
      searchItems();
    };
  });
  const allItemsButtonElement = document.getElementById('all-items-btn');
  if (allItemsButtonElement) { 
    allItemsButtonElement.onclick = () => {
        selectedFolder = null;
        searchItems();
    };
  }

  foldersList.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-folder-btn')) {
      e.preventDefault();
      const folderName = e.target.dataset.folderName;
      currentEditingFolder = folders.find(f => f.name === folderName);
      if (currentEditingFolder) {
        editFolderNameInput.value = currentEditingFolder.name;
        editFolderColorSelect.value = currentEditingFolder.color;
        editFolderIconSelect.value = currentEditingFolder.icon;
        editFolderModal.classList.remove('hidden');
      }
    }
  });

  folderIconSelect.innerHTML = '';
  editFolderIconSelect.innerHTML = '';
  folderIconOptions.forEach(optionData => {
    folderIconSelect.appendChild(createOptionWithSVG(optionData.value, optionData.textKey, optionData.value));
    editFolderIconSelect.appendChild(createOptionWithSVG(optionData.value, optionData.textKey, optionData.value));
  });
  applyTheme();
}

/**
 * Função para atualizar a lista de tags salvas e os datalists de tags para autocompletar.
 */
function updateSavedTagsList() {
    tagsList.innerHTML = '';
    savedTagsDatalist.innerHTML = '';
    savedTagsDatalistSearch.innerHTML = '';

    savedTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.classList.add('tag-item');
        tagElement.innerHTML = `
            <span>${tag}</span>
            <div class="tag-item-buttons">
                <button class="edit-tag-btn edit" data-tag="${tag}" data-i18n="editBtn">${window.translations[currentLanguage]['editBtn']}</button>
                <button class="delete-tag-btn delete" data-tag="${tag}" data-i18n="deleteBtn">${window.translations[currentLanguage]['deleteBtn']}</button>
            </div>
        `;
        tagsList.appendChild(tagElement);

        const option = document.createElement('option');
        option.value = tag;
        savedTagsDatalist.appendChild(option);

        const searchOption = document.createElement('option');
        searchOption.value = tag;
        savedTagsDatalistSearch.appendChild(searchOption);
    });
    localStorage.setItem('savedTags', JSON.stringify(savedTags));
    applyTheme();
}

/**
 * Função para buscar metadados de uma URL (título, descrição, imagem).
 * Isso ajuda a popular a pré-visualização e os cards de itens.
 * @param {string} url - A URL para buscar metadados.
 * @returns {Promise<Object>} Um objeto contendo title, description e image.
 */
async function fetchMetadata(url) {
  try {
    const youtubeVideoId = getYouTubeVideoId(url);
    if (youtubeVideoId) {
        return {
            title: `${window.translations[currentLanguage]['youtubeVideoPrefix']}: ${youtubeVideoId}`,
            description: window.translations[currentLanguage]['youtubeVideoDescription'],
            image: `https://img.youtube.com/vi/${youtubeVideoId}/sddefault.jpg`
        };
    }

    const dailymotionRegex = /(?:dailymotion\.com\/(?:video|embed)\/|dai\.ly\/)([a-zA-Z0-9]+)/;
    const dailymotionMatch = url.match(dailymotionRegex);
    if (dailymotionMatch && dailymotionMatch[1]) {
        const dailymotionVideoId = dailymotionMatch[1];
        return {
            title: `${window.translations[currentLanguage]['dailymotionVideoPrefix']}: ${dailymotionVideoId}`,
            description: window.translations[currentLanguage]['dailymotionVideoDescription'],
            image: `https://www.dailymotion.com/thumbnail/video/${dailymotionVideoId}`
        };
    }

    if (url.includes('tiktok.com')) {
      const tiktokRegex = /(?:tiktok\.com\/@(?:[a-zA-Z0-9_]+\/video|v)\/)([0-9]+)/;
      const tiktokMatch = tiktokRegex.exec(url);
      const tiktokVideoId = tiktokMatch ? tiktokMatch[1] : 'Unknown';
      return {
        title: `${window.translations[currentLanguage]['tiktokVideoPrefix']}: ${tiktokVideoId}`,
        description: `${window.translations[currentLanguage]['tiktokVideoDescription']}`,
        image: `https://placehold.co/200x150?text=TikTok+Video`
      };
    }

    if (url.includes('kwai.com')) {
      const kwaiRegex = /(?:kwai\.com\/(?:photo|video)\/)([0-9]+)/;
      const kwaiMatch = kwaiRegex.exec(url);
      const kwaiContentId = kwaiMatch ? kwaiMatch[1] : 'Unknown';
      return {
        title: `${window.translations[currentLanguage]['kwaiVideoPrefix']}: ${kwaiContentId}`,
        description: `${window.translations[currentLanguage]['kwaiVideoDescription']}`,
        image: `https://placehold.co/200x150?text=Kwai+Content`
      };
    }

    if (url.includes('facebook.com')) {
        return {
            title: `${window.translations[currentLanguage]['facebookLinkPrefix']}`,
            description: `${window.translations[currentLanguage]['facebookLinkDescription']}`,
            image: `https://placehold.co/200x150?text=Facebook+Link`
        };
    }

    if (url.includes('instagram.com')) {
      return {
        title: `${window.translations[currentLanguage]['instagramLinkPrefix']}`,
        description: `${window.translations[currentLanguage]['instagramLinkDescription']}`,
        image: `https://placehold.co/200x150?text=Instagram+Content`
      };
    }

    const urlObj = new URL(url);
    const displayUrl = urlObj.hostname.replace('www.', '');
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);
    let dynamicTitle = `${window.translations[currentLanguage]['genericLinkPrefix']}: ${displayUrl}`;
    if (pathSegments.length > 0) {
        dynamicTitle = `${window.translations[currentLanguage]['genericLinkPrefix']}: ${pathSegments[pathSegments.length - 1].replace(/[-_]/g, ' ')}`;
        dynamicTitle = dynamicTitle.charAt(0).toUpperCase() + dynamicTitle.slice(1);
    }

    return {
      title: dynamicTitle,
      description: `${window.translations[currentLanguage]['genericContentFrom']} ${displayUrl}. (${window.translations[currentLanguage]['noMetadataAvailable']})`,
      image: `https://placehold.co/200x150?text=No+Preview`
    };
  } catch (error) {
    console.error('Failed to generate metadata placeholder:', error);
    return { title: url, description: window.translations[currentLanguage]['noMetadataAvailable'], image: `https://placehold.co/200x150?text=No+Preview` };
  }
}

/**
 * Função para obter o ID de um vídeo do YouTube a partir da URL.
 * @param {string} url - A URL do YouTube.
 * @returns {string|null} O ID do vídeo do YouTube ou null.
 */
function getYouTubeVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
}

/**
 * Função para atualizar a pré-visualização ao adicionar um novo item.
 * @param {string} url - A URL para pré-visualizar.
 */
async function updatePreview(url) {
  if (url.trim()) {
    previewContainer.classList.remove('hidden');
    previewImage.src = '';
    previewTitle.textContent = window.translations[currentLanguage]['loadingPreview'];
    previewDescription.textContent = window.translations[currentLanguage]['fetchingPreview'];

    const metadata = await fetchMetadata(url);
    previewImage.src = metadata.image;
    previewTitle.textContent = metadata.title;
    previewDescription.textContent = metadata.description;
    previewImage.onerror = function() {
        this.src = `https://placehold.co/80?text=${window.translations[currentLanguage]['noPreview'].replace(/ /g, '+')}`;
    };
  } else {
    previewContainer.classList.add('hidden');
  }
}

/**
 * Função para renderizar a lista de itens salvos (ou itens filtrados).
 * @param {Array<Object>} [filteredItems=items] - O array de itens a serem renderizados.
 */
async function renderItems(filteredItems = items) {
  itemsList.innerHTML = '';
  if (filteredItems.length === 0) {
    itemsList.innerHTML = `<p class="text-gray-600">${window.translations[currentLanguage]['noItemsFound']}</p>`;
    return;
  }

  for (const item of filteredItems) {
    // Encontra a pasta, ou usa um objeto padrão para "sem pasta"
    const folder = folders.find(f => f.name === item.folder) || {
        name: window.translations[currentLanguage]['noFolder'],
        color: 'bg-gray-500', // Cor padrão para itens sem pasta
        icon: 'svg/folder.svg'
    };
    
    // Certifique-se de que item.metadata esteja populado
    if (!item.metadata || !item.metadata.title || (item.metadata.image && item.metadata.image.includes('placehold.co'))) {
      item.metadata = await fetchMetadata(item.url);
      localStorage.setItem('items', JSON.stringify(items)); // Salva a atualização dos metadados
    }
    const { title, description, image } = item.metadata;
    const addedDate = item.timestamp ? new Date(item.timestamp).toLocaleString(currentLanguage) : '';

    let starsHtml = '<div class="display-rating">';
    for (let i = 1; i <= 5; i++) {
        starsHtml += `<span class="star${item.rating >= i ? '' : '-empty'}">★</span>`;
    }
    starsHtml += '</div>';

    let clickableElement;
    if (item.type === 'video') {
        clickableElement = `
            <div class="flex flex-col items-center text-center w-full flex-grow cursor-pointer" data-item-id="${item.id}" data-url="${item.url}" data-item-type="${item.type}" onclick="openVideoPlayer('${item.url.replace(/'/g, "\\'")}', '${item.type}', ${item.id})">
                <img src="${image}" alt="Preview" class="item-thumbnail-img" onerror="this.src='https://placehold.co/200x150?text=${window.translations[currentLanguage]['noPreview'].replace(/ /g, '+')}'">
                <div class="w-full mt-3 flex-grow flex flex-col justify-center">
                    <div class="item-title truncate-lines-2 leading-tight">${title}</div>
                    <p class="item-url-short">${item.url.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0]}</p>
                    <p class="item-added-date">${addedDate}</p>
                </div>
            </div>`;
    } else {
        clickableElement = `
            <a href="${item.url}" target="_blank" class="flex flex-col items-center text-center w-full flex-grow no-underline ${theme === 'light' ? 'text-gray-800' : 'text-white'}" data-item-id="${item.id}">
                <img src="${image}" alt="Preview" class="item-thumbnail-img" onerror="this.src='https://placehold.co/200x150?text=${window.translations[currentLanguage]['noPreview'].replace(/ /g, '+')}'">
                <div class="w-full mt-3 flex-grow flex flex-col justify-center">
                    <div class="item-title truncate-lines-2 leading-tight">${title}</div>
                    <p class="item-url-short">${item.url.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0]}</p>
                    <p class="item-added-date">${addedDate}</p>
                </div>
            </a>`;
    }

    // Determine a cor da borda animada
    const folderColorHex = FOLDER_COLOR_MAP[folder.color] || FOLDER_COLOR_MAP['bg-gray-500']; // Garante uma cor padrão

    const itemHtml = `
      <div class="glass-effect p-3 sm:p-4 rounded-xl hover:shadow-xl transition-all flex flex-col items-center justify-between h-full animated-border" style="--folder-color: ${folderColorHex};">
        ${clickableElement}
        <div class="flex flex-wrap items-center justify-center gap-1 sm:gap-2 mt-4 pt-4 border-t border-white/10 w-full item-actions-bottom">
          <span class="inline-block w-3 h-3 sm:w-4 sm:h-4 ${folder.color} rounded-full"></span>
          ${starsHtml} 
          <button class="copy-btn px-2 sm:px-3 py-1 bg-gradient-to-r from-green-600 to-green-700 rounded-lg text-white text-sm hover:from-green-700 hover:to-green-800" data-url="${item.url}" data-i18n="copyBtn">${window.translations[currentLanguage]['copyBtn']}</button>
          <button class="edit-item-btn px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white text-sm hover:from-blue-700 hover:to-blue-800" data-id="${item.id}" data-i18n="editBtn">${window.translations[currentLanguage]['editBtn']}</button>
          <button class="delete-btn px-2 sm:px-3 py-1 bg-gradient-to-r from-red-500 to-red-700 rounded-lg text-white text-sm hover:from-red-600 hover:to-red-800" data-id="${item.id}" data-i18n="deleteBtn">${window.translations[currentLanguage]['deleteBtn']}</button>
        </div>
      </div>
    `;
    itemsList.innerHTML += itemHtml;
  }
  applyTheme();
}

/**
 * Função para abrir o modal do reprodutor de vídeo e carregar o vídeo.
 * @param {string} url - A URL do vídeo.
 * @param {string} type - O tipo do item (deve ser 'video').
 * @param {number} itemId - O ID do item no array `items`.
 */
function openVideoPlayer(url, type, itemId) {
    let embedUrl = '';

    if (type === 'video') {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = getVideoIdFromUrl(url, 'youtube');
            if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
        } else if (url.includes('dailymotion.com') || url.includes('dai.ly')) {
            const videoId = getVideoIdFromUrl(url, 'dailymotion');
            if (videoId) embedUrl = `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
        } else if (url.includes('tiktok.com')) {
            const videoId = getVideoIdFromUrl(url, 'tiktok');
            if (videoId) embedUrl = `https://www.tiktok.com/embed/v2/${videoId}`;
        } else if (url.includes('kwai.com')) {
            const videoId = getVideoIdFromUrl(url, 'kwai');
            if (videoId) embedUrl = `https://m.kwai.com/photo/${videoId}/embed`;
        } else if (url.includes('facebook.com')) {
            window.open(url, '_blank');
            const item = items.find(i => i.id === itemId);
            if (item) {
                if (!item.accessHistory) item.accessHistory = [];
                item.accessHistory.push(Date.now());
                localStorage.setItem('items', JSON.stringify(items));
            }
            return;
        }
    }

    if (embedUrl) {
        videoPlayerIframeContainer.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
        videoPlayerModal.classList.remove('hidden');
        
        const item = items.find(i => i.id === itemId);
        if (item) {
            if (!item.accessHistory) {
                item.accessHistory = [];
            }
            item.accessHistory.push(Date.now());
            localStorage.setItem('items', JSON.stringify(items));
        }
    } else {
        window.open(url, '_blank');
        const item = items.find(i => i.id === itemId);
        if (item) {
            if (!item.accessHistory) item.accessHistory = [];
            item.accessHistory.push(Date.now());
            localStorage.setItem('items', JSON.stringify(items));
        }
    }
}

/**
 * Função para fechar o modal do reprodutor de vídeo.
 */
function closeVideoPlayerModal() {
    videoPlayerIframeContainer.innerHTML = '';
    videoPlayerModal.classList.add('hidden');
    updateDashboard();
}

/**
 * Função para realizar a busca/filtragem de itens na lista principal.
 */
function searchItems() {
  const query = searchQueryInput.value.toLowerCase();
  const tagsQuery = searchTagsInput.value.toLowerCase().split(',').map(tag => tag.trim()).filter(tag => tag);
  const type = searchTypeSelect.value;
  const folder = searchFolderSelect.value;
  const minRating = parseInt(searchRatingSelect.value);

  const filteredItems = items.filter(item => {
    const matchesQuery = query === '' || item.url.toLowerCase().includes(query) || 
                        (item.metadata && item.metadata.title && item.metadata.title.toLowerCase().includes(query)) ||
                        (item.metadata && item.metadata.description && item.metadata.description.toLowerCase().includes(query));
    
    const matchesTags = tagsQuery.length === 0 || 
                        (item.tags && item.tags.some(tag => tagsQuery.some(searchTag => tag.toLowerCase().includes(searchTag))));

    const matchesType = type === 'all' || item.type === type;
    const matchesFolder = (folder === 'all' && (selectedFolder === null || item.folder === selectedFolder)) || 
                          (item.folder === folder);
    
    const matchesRating = isNaN(minRating) || searchRatingSelect.value === 'all' ||
                          (searchRatingSelect.value === '0' && (item.rating === 0 || item.rating === undefined)) ||
                          (item.rating >= minRating);

    return matchesQuery && matchesTags && matchesType && matchesFolder && matchesRating;
  });
  renderItems(filteredItems);
}

/**
 * Função de fallback para copiar texto para a área de transferência (usado quando navigator.clipboard falha).
 * @param {string} text - O texto a ser copiado.
 */
function fallbackCopyTextToClipboard(text) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand('copy');
        showCustomModal(window.translations[currentLanguage]['urlCopied'] + ' (Fallback)', window.translations[currentLanguage]['okBtn']);
    } catch (err) {
        console.error('Failed to copy using document.execCommand:', err);
        showCustomModal(window.translations[currentLanguage]['copyFailed'], window.translations[currentLanguage]['okBtn']);
    } finally {
        document.body.removeChild(tempInput);
    }
}

/**
 * Função genérica para exibir um modal customizado (substitui o 'alert' padrão do navegador).
 * @param {string} message - A mensagem a ser exibida no modal.
 * @param {string} [okBtnText='OK'] - O texto do botão de confirmação.
 */
function showCustomModal(message, okBtnText = 'OK') {
    const modal = document.createElement('div');
    modal.classList.add('modal-overlay');
    modal.innerHTML = `
        <div class="modal-content">
            <p>${message}</p>
            <div class="modal-actions">
                <button class="modal-btn confirm" id="modal-ok-btn">${okBtnText}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('modal-ok-btn').addEventListener('click', () => {
        modal.remove();
    });
}

/**
 * Função genérica para exibir um modal de confirmação (substitui o 'confirm' padrão do navegador).
 * @param {string} message - A mensagem de confirmação.
 * @param {Function} onConfirm - Callback a ser executado se o usuário confirmar.
 * @param {Function} [onCancel] - Callback a ser executado se o usuário cancelar.
 * @param {string} [yesBtnText='Sim'] - Texto do botão "Sim".
 * @param {string} [noBtnText='Não'] - Texto do botão "Não".
 */
function showConfirmModal(message, onConfirm, onCancel, yesBtnText = 'Sim', noBtnText = 'Não') {
    const modal = document.createElement('div');
    modal.classList.add('modal-overlay');
    modal.innerHTML = `
        <div class="modal-content">
            <p>${message}</p>
            <div class="modal-actions">
                <button class="modal-btn confirm" id="confirm-action-btn">${yesBtnText}</button>
                <button class="modal-btn cancel" id="cancel-action-btn">${noBtnText}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('confirm-action-btn').addEventListener('click', () => {
        modal.remove();
        onConfirm();
    });

    document.getElementById('cancel-action-btn').addEventListener('click', () => {
        modal.remove();
        if (onCancel) onCancel();
    });
}

/**
 * Função para mostrar a mensagem de carregamento na tela.
 * @param {string} message - O texto da mensagem de carregamento.
 * @param {number} [duration=0] - Duração em milissegundos para a mensagem ser exibida (0 para não esconder automaticamente).
 */
function showLoadingMessage(message, duration = 0) {
    loadingMessage.textContent = message;
    loadingMessage.style.display = 'block';
    if (duration > 0) {
        setTimeout(() => {
            hideLoadingMessage();
        }, duration);
    }
}

/**
 * Função para ocultar a mensagem de carregamento da tela.
 */
function hideLoadingMessage() {
    loadingMessage.style.display = 'none';
}

/**
 * Lógica para verificar atualizações do aplicativo.
 */
async function checkForUpdates() {
  console.log("8. checkForUpdates: Chamado.");
  showLoadingMessage(window.translations[currentLanguage]['updateChecking']);
  try {
    console.log("9. checkForUpdates: Versão atual do app (dentro da função):", CURRENT_APP_VERSION);
    
    // O URL para o seu arquivo update.json no GitHub
    const response = await fetch("https://raw.githubusercontent.com/text0359/linksprevieworganizer2.0/main/update.json");
    console.log("10. checkForUpdates: Resposta da requisição recebida.");
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("11. checkForUpdates: Dados da atualização recebidos:", data);

    if (data.latestVersion && data.latestVersion !== CURRENT_APP_VERSION) {
        let changelogText = '';
        if (data.changelog) {
            changelogText = `${window.translations[currentLanguage]['updateChangelog']}\n\n${data.changelog}`;
        }

        showConfirmModal(
            `${window.translations[currentLanguage]['updateAvailable'](data.latestVersion)}\n\n${changelogText}\n\n${window.translations[currentLanguage]['updateDownloadPrompt']}`,
            () => {
                if (typeof require !== 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.electron) {
                    require('electron').shell.openExternal(data.downloadUrl);
                } else {
                    window.open(data.downloadUrl, '_blank');
                }
            },
            () => { /* Usuário cancelou o download, não faz nada */ },
            window.translations[currentLanguage]['updateDownload'],
            window.translations[currentLanguage]['cancelBtn']
        );
    } else {
        showCustomModal(window.translations[currentLanguage]['updateNoAvailable'], window.translations[currentLanguage]['okBtn']);
    }
  } catch (error) {
    console.error("12. checkForUpdates: Erro ao verificar atualizações:", error);
    showCustomModal("Erro ao verificar atualizações. Por favor, tente novamente mais tarde.", window.translations[currentLanguage]['okBtn']);
  } finally {
    hideLoadingMessage();
    console.log("13. checkForUpdates: Finalizado.");
  }
}