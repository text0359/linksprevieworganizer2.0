// **Variáveis de Estado Globais:**
// Armazenam os dados principais do aplicativo, carregados do localStorage ou inicializados.
let items = JSON.parse(localStorage.getItem('items')) || [];
// Garante que cada item tenha as propriedades esperadas. Isso é importante para compatibilidade com versões antigas dos dados.
items = items.map(item => ({
  ...item,
  tags: item.tags || [], // Assegura que 'tags' é um array
  metadata: item.metadata || {}, // Assegura que 'metadata' é um objeto
  rating: item.rating !== undefined ? item.rating : 0, // Define 'rating' como 0 se não existir
  accessHistory: item.accessHistory || [] // Inicializa 'accessHistory' como um array vazio
}));
// Adicione este objeto de mapeamento de cores no config.js
const FOLDER_COLOR_MAP = {
    'bg-blue-500': '#3b82f6', // Tailwind blue-500
    'bg-green-500': '#22c55e', // Tailwind green-500
    'bg-red-500': '#ef4444',   // Tailwind red-500
    'bg-purple-500': '#a855f7',// Tailwind purple-500
    'bg-yellow-500': '#eab308',// Tailwind yellow-500
    'bg-black': '#000000',     // Black
    'bg-teal-600': '#0d9488',  // Tailwind teal-600
    'bg-pink-600': '#db2777',  // Tailwind pink-600
    'bg-gray-500': '#6b7280'   // Tailwind gray-500 (para "Outros Links" e "No Folder")
};
let folders = JSON.parse(localStorage.getItem('folders')) || [
  // Pastas padrão iniciais para o aplicativo
  { name: 'TikTok', color: 'bg-black', icon: 'svg/tiktok.svg' },
  { name: 'Kwai', color: 'bg-yellow-500', icon: 'svg/kwai.svg' },
  { name: 'Facebook', color: 'bg-blue-600', icon: 'svg/facebook.svg' },
  { name: 'Instagram', color: 'bg-pink-600', icon: 'svg/instagram.svg' },
  { name: 'YouTube', color: 'bg-red-600', icon: 'svg/youtube.svg' },
  { name: 'Dailymotion', color: 'bg-teal-600', icon: 'svg/dailymotion.svg' },
  { name: 'Outros Links', color: 'bg-gray-500', icon: 'svg/link.svg' }
];
let savedTags = JSON.parse(localStorage.getItem('savedTags')) || []; // Tags salvas pelo usuário
let theme = localStorage.getItem('theme') || 'light'; // Tema atual (claro/escuro)
let currentLanguage = localStorage.getItem('language') || 'pt-BR'; // Idioma atual

let selectedFolder = null; // A pasta atualmente selecionada para filtrar itens (null para "Todos os Itens")
let currentEditingTag = null; // Armazena a tag que está sendo editada no modal
let currentEditingItem = null; // Armazena o item que está sendo editado no modal
let currentEditingFolder = null; // Armazena a pasta que está sendo editada no modal
let importedDataCache = null; // Cache temporário para os dados lidos de um arquivo JSON importado

// **Referências a Elementos do DOM (Document Object Model):**
// Captura elementos HTML pelo ID para manipulá-los via JavaScript.
// NOTA: Para checkUpdateBtn, a captura será feita em main.js para evitar ReferenceErrors.
// Referências aos botões de scroll
const backToTopBtn = document.getElementById('back-to-top-btn');
const goToBottomBtn = document.getElementById('go-to-bottom-btn');

// Seção de Adicionar Novo Item
const itemUrlInput = document.getElementById('item-url');
const itemTagsInput = document.getElementById('item-tags');
const itemTypeSelect = document.getElementById('item-type');
const itemFolderSelect = document.getElementById('item-folder');
const addItemBtn = document.getElementById('add-item-btn');
const pasteLinkBtn = document.getElementById('paste-link-btn');
const previewContainer = document.getElementById('preview-container');
const previewImage = document.getElementById('preview-image');
const previewTitle = document.getElementById('preview-title');
const previewDescription = document.getElementById('preview-description');

// Seção de Criar Nova Pasta
const newFolderInput = document.getElementById('new-folder');
const folderColorSelect = document.getElementById('folder-color');
const folderIconSelect = document.getElementById('folder-icon');
const addFolderBtn = document.getElementById('add-folder-btn');

// Seção de Busca de Itens
const searchQueryInput = document.getElementById('search-query');
const searchTagsInput = document.getElementById('search-tags-input');
const searchTypeSelect = document.getElementById('search-type');
const searchFolderSelect = document.getElementById('search-folder');
const searchRatingSelect = document.getElementById('search-rating');

// Listas e Paineis Globais
const foldersList = document.getElementById('folders-list');
const foldersListContainer = document.getElementById('folders-list-container');
const toggleFoldersBtn = document.getElementById('toggle-folders-btn');
const allItemsBtn = document.getElementById('all-items-btn');
const itemsList = document.getElementById('items-list');
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const toggleThemeBtn = document.getElementById('toggle-theme-btn');
const clearItemsBtn = document.getElementById('clear-items-btn');
const manageDataBtn = document.getElementById('manage-data-btn');
const languageSelect = document.getElementById('language-select');

// Elementos do Gerenciamento de Tags (no Painel de Configurações)
const newTagInput = document.getElementById('new-tag-input');
const addTagBtn = document.getElementById('add-tag-btn');
const tagsList = document.getElementById('tags-list');
const savedTagsDatalist = document.getElementById('saved-tags-datalist');
const savedTagsDatalistSearch = document.getElementById('saved-tags-datalist-search');

// Elementos dos Modais de Edição (Pasta, Item, Tag)
const editFolderModal = document.getElementById('edit-folder-modal');
const editFolderNameInput = document.getElementById('edit-folder-name');
const editFolderColorSelect = document.getElementById('edit-folder-color');
const editFolderIconSelect = document.getElementById('edit-folder-icon');
const saveFolderChangesBtn = document.getElementById('save-folder-changes-btn');
const deleteFolderFromModalBtn = document.getElementById('delete-folder-from-modal-btn');

const editItemModal = document.getElementById('edit-item-modal');
const editItemUrlInput = document.getElementById('edit-item-url');
const editItemTagsInput = document.getElementById('edit-item-tags');
const editItemTypeSelect = document.getElementById('edit-item-type');
const editItemFolderSelect = document.getElementById('edit-item-folder');
const editItemRatingInputs = document.querySelectorAll('#edit-item-rating input[name="rating-edit"]');
const saveItemChangesBtn = document.getElementById('save-item-changes-btn');

const editTagModal = document.getElementById('edit-tag-modal');
const editTagNameInput = document.getElementById('edit-tag-name');
const saveTagChangesBtn = document.getElementById('save-tag-changes-btn');

// Elementos do Modal de Gerenciamento de Dados (Import/Export)
const manageDataModal = document.getElementById('manage-data-modal');
const exportDataOptionBtn = document.getElementById('export-data-option-btn');
const importFileModalInput = document.getElementById('import-file-modal-input');
const loadingMessage = document.getElementById('loading-message');

// Elementos do Modal de Seleção de Opções de Importação
const importSelectionModal = document.getElementById('import-selection-modal');
const importItemsCheckbox = document.getElementById('import-items-checkbox');
const importFoldersCheckbox = document.getElementById('import-folders-checkbox');
const importTagsCheckbox = document.getElementById('import-tags-checkbox');
const importThemeCheckbox = document.getElementById('import-theme-checkbox');
const importLanguageCheckbox = document.getElementById('import-language-checkbox');
const confirmImportSelectionBtn = document.getElementById('confirm-import-selection-btn');

// Elementos do Sistema de Abas
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Elementos específicos do Dashboard
const dashboardTotalItems = document.getElementById('dashboard-total-items');
const dashboardItemsByType = document.getElementById('dashboard-items-by-type');
const dashboardTotalFolders = document.getElementById('dashboard-total-folders');
const dashboardItemsByFolder = document.getElementById('dashboard-items-by-folder');
const dashboardTotalTags = document.getElementById('dashboard-total-tags');
const dashboardTopTags = document.getElementById('dashboard-top-tags');
const dashboardItemsByRating = document.getElementById('dashboard-items-by-rating');
const dashboardCurrentTheme = document.getElementById('dashboard-current-theme');
const dashboardCurrentLanguage = document.getElementById('dashboard-current-language');
const dashboardLastAccessedItems = document.getElementById('dashboard-last-accessed-items');
const dashboardMostAccessedVideos = document.getElementById('dashboard-most-accessed-videos');

// Elementos do Reprodutor de Vídeo (modal)
const videoPlayerModal = document.getElementById('video-player-modal');
const videoPlayerIframeContainer = document.getElementById('video-player-iframe-container');

const CURRENT_APP_VERSION = "1.0.0"; // <<< IMPORTANTE: Atualize esta string de versão para cada novo lançamento!

// **Objeto de Traduções:**
// Contém todas as strings do aplicativo em diferentes idiomas para internacionalização.
window.translations = {
  'pt-BR': {
    appTitle: 'Links Preview Organizer2.0',
    settingsBtn: 'Configurações',
    exportBtn: 'Exportar',
    manageDataBtn: 'Gerenciar Dados',
    settingsTitle: 'Configurações',
    toggleDarkThemeBtn: 'Alternar Tema Escuro',
    clearAllItemsBtn: 'Limpar Todos os Itens',
    checkUpdateBtn: 'Verificar Atualizações',
    updateAvailable: (version) => `Nova versão disponível: v${version}`,
    updateNoAvailable: 'Seu aplicativo está atualizado!',
    updateChangelog: 'Notas da versão:',
    updateDownloadPrompt: 'Deseja baixar agora?',
    updateDownload: 'Baixar',
    updateChecking: 'Verificando atualizações...',
    importBtn: 'Importar',
    selectImportOptions: 'Selecionar Opções de Importação',
    foldersCheckbox: 'Pastas',
    itemsCheckbox: 'Itens',
    tagsCheckbox: 'Tags',
    themeCheckbox: 'Tema',
    languageCheckbox: 'Idioma',
    confirmImportBtn: 'Confirmar Importação',
    languageLabel: 'Idioma:',
    addNewItemTitle: 'Adicionar Novo Item',
    itemUrlPlaceholder: 'Inserir ou colar URL (ex: vídeo, foto, site)',
    itemTagsPlaceholder: 'Tags (ex: inspiração, trabalho, separadas por vírgulas)',
    pasteLinkBtn: 'Colar Link',
    optionLink: 'Link',
    optionVideo: 'Vídeo',
    optionPhoto: 'Foto',
    addItemBtn: 'Adicionar Item',
    createNewFolderTitle: 'Criar Nova Pasta',
    newFolderNamePlaceholder: 'Nome da nova pasta',
    colorBlue: 'Azul',
    colorGreen: 'Verde',
    colorRed: 'Vermelho',
    colorPurple: 'Roxo',
    colorYellow: 'Amarelo',
    colorBlack: 'Preto',
    colorTeal: 'Ciano',
    colorPink: 'Rosa',
    iconTikTok: 'TikTok',
    iconKwai: 'Kwai',
    iconFacebook: 'Facebook',
    iconInstagram: 'Instagram',
    iconYouTube: 'YouTube',
    iconDailymotion: 'Dailymotion',
    iconFolder: 'Pasta',
    iconLink: 'Outro Link',
    addFolderBtn: 'Adicionar Pasta',
    foldersTitle: 'Pastas',
    allItemsBtn: 'Todos os Itens',
    searchItemsTitle: 'Buscar Itens',
    searchQueryPlaceholder: 'Buscar por URL ou título/descrição...',
    searchTagsPlaceholder: 'Buscar por tags (separadas por vírgulas)...',
    allTypes: 'Todos os Tipos',
    allFolders: 'Todas as Pastas',
    allRatings: 'Todas as Avaliações',
    savedItemsTitle: 'Itens Salvos',
    editFolderTitle: 'Editar Pasta',
    folderNameLabel: 'Nome da Pasta:',
    folderColorLabel: 'Cor da Pasta:',
    folderIconLabel: 'Ícone da Pasta:',
    saveChangesBtn: 'Salvar Alterações',
    deleteFolderBtn: 'Excluir Pasta',
    cancelBtn: 'Cancelar',
    editItemTitle: 'Editar Elemento',
    urlLabel: 'URL:',
    tagsLabel: 'Tags (separadas por vírgula):',
    typeLabel: 'Tipo:',
    folderLabel: 'Pasta:',
    ratingLabel: 'Avaliação:',
    copyBtn: 'Copiar',
    editBtn: 'Editar',
    deleteBtn: 'Excluir',
    rateBtn: 'Avaliar',
    noItemsFound: 'Nenhum item encontrado.',
    itemType: 'Tipo',
    itemFolder: 'Pasta',
    noFolder: 'N/A',
    youtubeVideoPrefix: 'Vídeo do YouTube',
    youtubeVideoDescription: 'Assista a este vídeo no YouTube.',
    dailymotionVideoPrefix: 'Vídeo do Dailymotion',
    dailymotionVideoDescription: 'Assista a este vídeo no Dailymotion.',
    instagramLinkPrefix: 'Link do Instagram',
    instagramLinkDescription: 'Ver este conteúdo no Instagram.',
    tiktokVideoPrefix: 'Vídeo do TikTok',
    tiktokVideoDescription: 'Veja este vídeo no TikTok.',
    kwaiVideoPrefix: 'Vídeo do Kwai',
    kwaiVideoDescription: 'Veja este vídeo no Kwai.',
    facebookLinkPrefix: 'Link do Facebook',
    facebookLinkDescription: 'Veja este conteúdo no Facebook.',
    genericLinkPrefix: 'Link',
    genericContentFrom: 'Conteúdo de',
    noMetadataAvailable: 'Nenhum metadado disponível',
    noPreview: 'Sem Pré-visualização',
    loadingPreview: 'Carregando pré-visualização...',
    fetchingPreview: 'Buscando pré-visualização...',
    invalidUrl: 'Link Inválido',
    enterValidUrl: 'Por favor, insira uma URL válida.',
    pasteFailed: 'Falha ao colar: O navegador pode ter impedido o acesso à área de transferência.',
    urlCopied: 'URL copiada para a área de transferência!',
    copyFailed: 'Falha ao copiar: Por favor, tente copiar manualmente.',
    confirmDeleteItem: 'Tem certeza de que deseja excluir este item?',
    confirmClearAllItems: 'Tem certeza de que deseja limpar todos os itens?',
    confirmImport: 'Confirmar importação? Isso pode substituir dados existentes. Você pode escolher quais dados importar.',
    folderAlreadyExists: (name) => `A pasta "${name}" já existe.`,
    folderNameEmpty: 'Por favor, insira um nome para a pasta.',
    confirmDeleteFolder: (name, linksCount) => {
        if (linksCount > 0) {
            return `Tem certeza de que deseja excluir a pasta "${name}"? Todos os ${linksCount} links dentro dela serão movidos para "All Items".`;
        } else {
            return `Tem certeza de que deseja excluir a pasta "${name}"? Não há links nesta pasta.`;
        }
    },
    invalidJsonFile: 'Arquivo JSON inválido.',
    yesBtn: 'Sim',
    noBtn: 'Não',
    okBtn: 'OK',
    manageTagsTitle: 'Gerenciar Tags',
    newTagPlaceholder: 'Nome da nova tag',
    addTagBtn: 'Adicionar Tag',
    editTagTitle: 'Editar Tag',
    tagNameLabel: 'Nome da Tag:',
    itemsInFolder: 'itens',
    dashboardTab: 'Dashboard',
    createSaveTab: 'Criar/Salvar Links',
    foldersItemsTab: 'Pastas & Itens Salvos',
    dashboardTitle: 'Dashboard',
    dashboardContent: 'Bem-vindo ao seu painel! Aqui você encontrará um resumo de seus dados.',
    totalItems: 'Total de Itens',
    itemsByType: 'Itens por Tipo',
    totalFolders: 'Total de Pastas',
    itemsByFolder: 'Itens por Pasta',
    totalTags: 'Total de Tags',
    topTags: 'Tags Mais Usadas',
    itemsByRating: 'Itens por Avaliação',
    systemInfo: 'Informações do Sistema',
    currentTheme: 'Tema Atual:',
    currentLanguage: 'Idioma Atual:',
    linkType: 'Link',
    videoType: 'Vídeo',
    photoType: 'Foto',
    noRating: 'Não Avaliado',
    star: 'Estrela',
    stars: 'Estrelas',
    noFolderAssigned: 'Não atribuído',
    dataPlaceholder: 'Nenhum dado',
    lastAccessedItemsTitle: 'Últimos Acessos (Vídeos)',
    accessedOn: 'Acessado em',
    mostAccessedItemsTitle: 'Vídeos Mais Acessados',
    copyIdBtn: 'Copiar ID',
    videoPlayerTitle: 'Reprodutor de Vídeo',
    collapseFoldersBtn: 'Recolher Pastas',
    expandFoldersBtn: 'Expandir Pastas',
    importingData: 'Importando dados...',
    importSuccess: 'Dados importados com sucesso!',
    importCanceled: 'Importação cancelada.',
    // Novas traduções para o rodapé
    aboutUsLink: 'Sobre Nós',
    privacyPolicyLink: 'Política de Privacidade',
    termsOfServiceLink: 'Termos de Serviço',
    contactUsLink: 'Contato',
  },
  'en': {
    appTitle: 'Liquid Glass Organizer',
    settingsBtn: 'Settings',
    exportBtn: 'Export',
    manageDataBtn: 'Manage Data',
    settingsTitle: 'Settings',
    toggleDarkThemeBtn: 'Toggle Dark Theme',
    clearAllItemsBtn: 'Clear All Items',
    checkUpdateBtn: 'Check for Updates',
    updateAvailable: (version) => `New version available: v${version}`,
    updateNoAvailable: 'Your app is up to date!',
    updateChangelog: 'Release Notes:',
    updateDownloadPrompt: 'Do you want to download now?',
    updateDownload: 'Download',
    updateChecking: 'Checking for updates...',
    importBtn: 'Import',
    selectImportOptions: 'Select Import Options',
    foldersCheckbox: 'Folders',
    itemsCheckbox: 'Items',
    tagsCheckbox: 'Tags',
    themeCheckbox: 'Theme',
    languageCheckbox: 'Language',
    confirmImportBtn: 'Confirm Import',
    languageLabel: 'Language:',
    addNewItemTitle: 'Add New Item',
    itemUrlPlaceholder: 'Enter or paste URL (e.g., video, photo, website)',
    itemTagsPlaceholder: 'Tags (e.g., inspiration, work, separated by commas)',
    pasteLinkBtn: 'Paste Link',
    optionLink: 'Link',
    optionVideo: 'Video',
    optionPhoto: 'Photo',
    addItemBtn: 'Add Item',
    createNewFolderTitle: 'Create New Folder',
    newFolderNamePlaceholder: 'New folder name',
    colorBlue: 'Blue',
    colorGreen: 'Green',
    colorRed: 'Red',
    colorPurple: 'Purple',
    colorYellow: 'Yellow',
    colorBlack: 'Black',
    colorTeal: 'Teal',
    colorPink: 'Pink',
    iconTikTok: 'TikTok',
    iconKwai: 'Kwai',
    iconFacebook: 'Facebook',
    iconInstagram: 'Instagram',
    iconYouTube: 'YouTube',
    iconDailymotion: 'Dailymotion',
    iconFolder: 'Folder',
    iconLink: 'Other Link',
    addFolderBtn: 'Add Folder',
    foldersTitle: 'Folders',
    allItemsBtn: 'All Items',
    searchItemsTitle: 'Search Items',
    searchQueryPlaceholder: 'Search by URL or title/description...',
    searchTagsPlaceholder: 'Search by tags (comma-separated)...',
    allTypes: 'All Types',
    allFolders: 'All Folders',
    allRatings: 'All Ratings',
    savedItemsTitle: 'Saved Items',
    editFolderTitle: 'Edit Folder',
    folderNameLabel: 'Folder Name:',
    folderColorLabel: 'Folder Color:',
    folderIconLabel: 'Folder Icon:',
    saveChangesBtn: 'Save Changes',
    deleteFolderBtn: 'Delete Folder',
    cancelBtn: 'Cancel',
    editItemTitle: 'Edit Item',
    urlLabel: 'URL:',
    tagsLabel: 'Tags (comma-separated):',
    typeLabel: 'Type:',
    folderLabel: 'Folder:',
    ratingLabel: 'Rating:',
    copyBtn: 'Copy',
    editBtn: 'Edit',
    deleteBtn: 'Delete',
    rateBtn: 'Rate',
    noItemsFound: 'No items found.',
    itemType: 'Type',
    itemFolder: 'Folder',
    noFolder: 'N/A',
    youtubeVideoPrefix: 'YouTube Video',
    youtubeVideoDescription: 'Watch this video on YouTube.',
    dailymotionVideoPrefix: 'Dailymotion Video',
    dailymotionVideoDescription: 'Watch this video on Dailymotion.',
    instagramLinkPrefix: 'Instagram Link',
    instagramLinkDescription: 'View this content on Instagram.',
    tiktokVideoPrefix: 'TikTok Video',
    tiktokVideoDescription: 'View this video on TikTok.',
    kwaiVideoPrefix: 'Kwai Video',
    kwaiVideoDescription: 'View this video on Kwai.',
    facebookLinkPrefix: 'Facebook Link',
    facebookLinkDescription: 'View this content on Facebook.',
    genericLinkPrefix: 'Link',
    genericContentFrom: 'Content from',
    noMetadataAvailable: 'No metadata available',
    noPreview: 'No Preview',
    loadingPreview: 'Loading preview...',
    fetchingPreview: 'Fetching preview...',
    invalidUrl: 'Invalid Link',
    enterValidUrl: 'Please enter a valid URL.',
    pasteFailed: 'Paste failed: Browser may have blocked clipboard access.',
    urlCopied: 'URL copied to clipboard!',
    copyFailed: 'Copy failed: Please try copying manually.',
    confirmDeleteItem: 'Are you sure you want to delete this item?',
    confirmClearAllItems: 'Are you sure you want to clear all items?',
    confirmImport: 'Confirm import? This may overwrite existing data. You can choose which data to import.',
    folderAlreadyExists: (name) => `Folder "${name}" already exists.`,
    folderNameEmpty: 'Please enter a folder name.',
    confirmDeleteFolder: (name, linksCount) => {
        if (linksCount > 0) {
            return `Are you sure you want to delete folder "${name}"? All ${linksCount} links inside it will be moved to "All Items".`;
        } else {
            return `Are you sure you want to delete folder "${name}"? There are no links in this folder.`;
        }
    },
    invalidJsonFile: 'Invalid JSON file.',
    yesBtn: 'Yes',
    noBtn: 'No',
    okBtn: 'OK',
    manageTagsTitle: 'Manage Tags',
    newTagPlaceholder: 'New tag name',
    addTagBtn: 'Add Tag',
    editTagTitle: 'Edit Tag',
    tagNameLabel: 'Tag Name:',
    itemsInFolder: 'items',
    dashboardTab: 'Dashboard',
    createSaveTab: 'Create/Save Links',
    foldersItemsTab: 'Folders & Saved Items',
    dashboardTitle: 'Dashboard',
    dashboardContent: 'Welcome to your dashboard! Here you will find a summary of your data.',
    totalItems: 'Total Items',
    itemsByType: 'Items by Type',
    totalFolders: 'Total Folders',
    itemsByFolder: 'Items by Folder',
    totalTags: 'Total Tags',
    topTags: 'Most Used Tags',
    itemsByRating: 'Items by Rating',
    systemInfo: 'System Info',
    currentTheme: 'Current Theme:',
    currentLanguage: 'Current Language:',
    linkType: 'Link',
    videoType: 'Video',
    photoType: 'Photo',
    noRating: 'Not Rated',
    star: 'Star',
    stars: 'Stars',
    noFolderAssigned: 'Not assigned',
    dataPlaceholder: 'No data',
    lastAccessedItemsTitle: 'Last Accessed Items (Videos)',
    accessedOn: 'Accessed on',
    mostAccessedItemsTitle: 'Most Accessed Videos',
    copyIdBtn: 'Copy ID',
    videoPlayerTitle: 'Video Player',
    collapseFoldersBtn: 'Collapse Folders',
    expandFoldersBtn: 'Expand Folders',
    importingData: 'Importing data...',
    importSuccess: 'Data imported successfully!',
    importCanceled: 'Import canceled.',
    // Novas traduções para o rodapé
    aboutUsLink: 'About Us',
    privacyPolicyLink: 'Privacy Policy',
    termsOfServiceLink: 'Terms of Service',
    contactUsLink: 'Contact Us',
  },
  'es': {
    appTitle: 'Organizador Vidrio Líquido',
    settingsBtn: 'Ajustes',
    exportBtn: 'Exportar',
    manageDataBtn: 'Gestionar Datos',
    settingsTitle: 'Ajustes',
    toggleDarkThemeBtn: 'Alternar Tema Oscuro',
    clearAllItemsBtn: 'Borrar Todos los Elementos',
    checkUpdateBtn: 'Buscar actualizaciones',
    updateAvailable: (version) => `Nueva versión disponible: v${version}`,
    updateNoAvailable: 'Su aplicación está actualizada.',
    updateChangelog: 'Notas de la versión:',
    updateDownloadPrompt: '¿Desea descargar ahora?',
    updateDownload: 'Descargar',
    updateChecking: 'Buscando actualizaciones...',
    importBtn: 'Importar',
    selectImportOptions: 'Seleccionar Opciones de Importación',
    foldersCheckbox: 'Carpetas',
    itemsCheckbox: 'Elementos',
    tagsCheckbox: 'Etiquetas',
    themeCheckbox: 'Tema',
    languageCheckbox: 'Idioma',
    confirmImportBtn: 'Confirmar Importación',
    languageLabel: 'Idioma:',
    addNewItemTitle: 'Añadir Nuevo Elemento',
    itemUrlPlaceholder: 'Introducir o pegar URL (ej: vídeo, foto, sitio web)',
    itemTagsPlaceholder: 'Etiquetas (ej: inspiración, trabajo, separadas por comas)',
    pasteLinkBtn: 'Pegar Enlace',
    optionLink: 'Enlace',
    optionVideo: 'Vídeo',
    optionPhoto: 'Foto',
    addItemBtn: 'Añadir Elemento',
    createNewFolderTitle: 'Crear Nueva Carpeta',
    newFolderNamePlaceholder: 'Nombre de la nueva carpeta',
    colorBlue: 'Azul',
    colorGreen: 'Verde',
    colorRed: 'Rojo',
    colorPurple: 'Morado',
    colorYellow: 'Amarillo',
    colorBlack: 'Negro',
    colorTeal: 'Cian',
    colorPink: 'Rosa',
    iconTikTok: 'TikTok',
    iconKwai: 'Kwai',
    iconFacebook: 'Facebook',
    iconInstagram: 'Instagram',
    iconYouTube: 'YouTube',
    iconDailymotion: 'Dailymotion',
    iconFolder: 'Carpeta',
    iconLink: 'Otro Enlace',
    addFolderBtn: 'Añadir Carpeta',
    foldersTitle: 'Carpetas',
    allItemsBtn: 'Todos los Elementos',
    searchItemsTitle: 'Buscar Elementos',
    searchQueryPlaceholder: 'Buscar por URL o título/descripción...',
    searchTagsPlaceholder: 'Buscar por etiquetas (separadas por comas)...',
    allTypes: 'Todos los Tipos',
    allFolders: 'Todas las Carpetas',
    allRatings: 'Todas las Valoraciones',
    savedItemsTitle: 'Elementos Guardados',
    editFolderTitle: 'Editar Carpeta',
    folderNameLabel: 'Nombre de la Carpeta:',
    folderColorLabel: 'Cor de la Carpeta:',
    folderIconLabel: 'Icono de la Carpeta:',
    saveChangesBtn: 'Guardar Cambios',
    deleteFolderBtn: 'Eliminar Carpeta',
    cancelBtn: 'Cancelar',
    editItemTitle: 'Editar Elemento',
    urlLabel: 'URL:',
    tagsLabel: 'Etiquetas (separadas por comas):',
    typeLabel: 'Tipo:',
    folderLabel: 'Carpeta:',
    ratingLabel: 'Valoración:',
    copyBtn: 'Copiar',
    editBtn: 'Editar',
    deleteBtn: 'Eliminar',
    rateBtn: 'Valorar',
    noItemsFound: 'No se encontraron elementos.',
    itemType: 'Tipo',
    itemFolder: 'Carpeta',
    noFolder: 'N/A',
    youtubeVideoPrefix: 'Video de YouTube',
    youtubeVideoDescription: 'Mira este video en YouTube.',
    dailymotionVideoPrefix: 'Video de Dailymotion',
    dailymotionVideoDescription: 'Mira este video en Dailymotion.',
    instagramLinkPrefix: 'Enlace de Instagram',
    instagramLinkDescription: 'Ver este contenido en Instagram.',
    tiktokVideoPrefix: 'Video de TikTok',
    tiktokVideoDescription: 'Mira este video en TikTok.',
    kwaiVideoPrefix: 'Kwai Video',
    kwaiVideoDescription: 'Mira este video en Kwai.',
    facebookLinkPrefix: 'Enlace de Facebook',
    facebookLinkDescription: 'Ver este contenido en Facebook.',
    genericLinkPrefix: 'Enlace',
    genericContentFrom: 'Contenido de',
    noMetadataAvailable: 'No hay metadatos disponibles',
    noPreview: 'Sin Vista Previa',
    loadingPreview: 'Cargando vista previa...',
    fetchingPreview: 'Obteniendo vista previa...',
    invalidUrl: 'Enlace Inválido',
    enterValidUrl: 'Por favor, introduce una URL válida.',
    pasteFailed: 'Error al pegar: El navegador pudo haber bloqueado el acceso al portapapeles.',
    urlCopied: '¡URL copiada al portapapeles!',
    copyFailed: 'Error al copiar: Por favor, intenta copiar manualmente.',
    confirmDeleteItem: '¿Estás seguro de que quieres eliminar este elemento?',
    confirmClearAllItems: '¿Estás seguro de que quieres borrar todos los elementos?',
    confirmImport: '¿Estás seguro de que quieres importar los datos seleccionados? Esto sobrescribirá tus datos existentes.',
    folderAlreadyExists: (name) => `La carpeta "${name}" ya existe.`,
    folderNameEmpty: 'Por favor, introduce un nombre para la carpeta.',
    confirmDeleteFolder: (name, linksCount) => {
        if (linksCount > 0) {
            return `¿Estás seguro de que quieres eliminar la carpeta "${name}"? Todos los ${linksCount} enlaces dentro de ella se moverán a "Todos los Elementos".`;
        } else {
            return `¿Estás seguro de que quieres eliminar la carpeta "${name}"? No hay enlaces en esta carpeta.`;
        }
    },
    invalidJsonFile: 'Archivo JSON inválido. Asegúrate de que sea un JSON válido.',
    yesBtn: 'Sí',
    noBtn: 'No',
    okBtn: 'OK',
    manageTagsTitle: 'Administrar Etiquetas',
    newTagPlaceholder: 'Nombre de la nueva etiqueta',
    addTagBtn: 'Añadir Etiqueta',
    editTagTitle: 'Editar Etiqueta',
    tagNameLabel: 'Nombre de la Etiqueta:',
    itemsInFolder: 'elementos',
    dashboardTab: 'Dashboard',
    createSaveTab: 'Crear/Guardar Enlaces',
    foldersItemsTab: 'Carpetas y Elementos Guardados',
    dashboardTitle: 'Dashboard',
    dashboardContent: '¡Bienvenido a tu panel! Aquí encontrarás un resumen de tus datos.',
    totalItems: 'Total de Elementos',
    itemsByType: 'Elementos por Tipo',
    totalFolders: 'Total de Carpetas',
    itemsByFolder: 'Elementos por Carpeta',
    totalTags: 'Total de Etiquetas',
    topTags: 'Etiquetas Más Usadas',
    itemsByRating: 'Elementos por Valoración',
    systemInfo: 'Información del Sistema',
    currentTheme: 'Tema Actual:',
    currentLanguage: 'Idioma Actual:',
    linkType: 'Enlace',
    videoType: 'Video',
    photoType: 'Foto',
    noRating: 'No Valorado',
    star: 'Estrella',
    stars: 'Estrellas',
    noFolderAssigned: 'No asignado',
    dataPlaceholder: 'No hay datos',
    lastAccessedItemsTitle: 'Últimos Elementos Accedidos (Vídeos)',
    accessedOn: 'Accedido el',
    mostAccessedItemsTitle: 'Elementos Más Accedidos',
    copyIdBtn: 'Copiar ID',
    videoPlayerTitle: 'Reproductor de Vídeo',
    collapseFoldersBtn: 'Recolher Carpetas',
    expandFoldersBtn: 'Expandir Carpetas',
    importingData: 'Importando datos...',
    importSuccess: 'Datos importados con éxito!',
    importCanceled: 'Importación cancelada.',
    // **Novas traduções para o rodapé - INÍCIO**
    aboutUsLink: 'Sobre Nosotros',
    privacyPolicyLink: 'Política de Privacidad',
    termsOfServiceLink: 'Términos de Servicio',
    contactUsLink: 'Contacto',
    // **Novas traduções para o rodapé - FIM**
  }
};