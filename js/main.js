// Este arquivo contém a lógica principal de inicialização do aplicativo e os event listeners.
// Ele depende de 'config.js' e 'functions.js' terem sido carregados primeiro.

// Adiciona event listeners para os botões das abas
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.dataset.tab + '-tab';
        showTab(tabId);
    });
});

// Event listener para o botão "Adicionar Item"
addItemBtn.addEventListener('click', async () => {
    const url = itemUrlInput.value.trim();
    const tags = itemTagsInput.value.trim().split(',').map(tag => tag.trim()).filter(tag => tag);
    if (url) {
        const isDuplicate = items.some(item => item.url === url);
        if (isDuplicate) {
            showCustomModal(window.translations[currentLanguage]['folderAlreadyExists'](url), window.translations[currentLanguage]['okBtn']);
            return;
        }

        const metadata = await fetchMetadata(url);
        items.push({
            id: Date.now(),
            url,
            type: itemTypeSelect.value,
            folder: itemFolderSelect.value,
            tags: tags.length > 0 ? tags : [],
            metadata,
            timestamp: Date.now(),
            rating: 0,
            accessHistory: []
        });
        tags.forEach(tag => {
            if (!savedTags.includes(tag)) {
                savedTags.push(tag);
            }
        });
        localStorage.setItem('savedTags', JSON.stringify(savedTags));
        localStorage.setItem('items', JSON.stringify(items));
        
        itemUrlInput.value = '';
        itemTagsInput.value = '';
        previewContainer.classList.add('hidden');
        
        updateSavedTagsList();
        renderItems();
        updateFolderSelects();
        updateDashboard();
    }
});

// Event listener para o botão "Colar Link"
pasteLinkBtn.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        itemUrlInput.value = text;
        await updatePreview(text);
    } catch (err) {
        console.error('Paste failed:', err);
        showCustomModal(window.translations[currentLanguage]['pasteFailed'], window.translations[currentLanguage]['okBtn']);
    }
});

// Event listener para o botão "Adicionar Pasta"
addFolderBtn.addEventListener('click', () => {
    const folderName = newFolderInput.value.trim();
    if (folderName && !folders.some(f => f.name === folderName)) {
        folders.push({
            name: folderName,
            color: folderColorSelect.value,
            icon: folderIconSelect.value
        });
        updateFolderSelects();
        newFolderInput.value = '';
        renderItems();
        updateDashboard();
    } else if (folderName) {
        showCustomModal(window.translations[currentLanguage]['folderAlreadyExists'](folderName), window.translations[currentLanguage]['okBtn']);
    } else {
        showCustomModal(window.translations[currentLanguage]['folderNameEmpty'], window.translations[currentLanguage]['okBtn']);
    }
});

// Event listeners para os inputs e selects de busca
searchQueryInput.addEventListener('input', searchItems);
searchTagsInput.addEventListener('input', searchItems);
searchTypeSelect.addEventListener('change', searchItems);
searchFolderSelect.addEventListener('change', (e) => {
    selectedFolder = e.target.value === 'all' ? null : e.target.value;
    searchItems();
});
searchRatingSelect.addEventListener('change', searchItems);

// Delegação de eventos para botões de copiar, editar e excluir itens na lista principal
itemsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = parseInt(e.target.dataset.id);
        showConfirmModal(window.translations[currentLanguage]['confirmDeleteItem'], () => {
            items = items.filter(item => item.id !== id);
            localStorage.setItem('items', JSON.stringify(items));
            renderItems();
            updateFolderSelects();
            updateDashboard();
        }, window.translations[currentLanguage]['yesBtn'], window.translations[currentLanguage]['noBtn']);
    } else if (e.target.classList.contains('copy-btn')) {
        const url = e.target.dataset.url;
        try {
            navigator.clipboard.writeText(url).then(() => {
                showCustomModal(window.translations[currentLanguage]['urlCopied'], window.translations[currentLanguage]['okBtn']);
            }).catch(err => {
                console.error('Failed to copy using navigator.clipboard (promise-based):', err);
                fallbackCopyTextToClipboard(url);
            });
        } catch (err) {
            console.error('Failed to copy using navigator.clipboard (synchronous):', err);
            fallbackCopyTextToClipboard(url);
        }
    } else if (e.target.classList.contains('edit-item-btn')) {
        const id = parseInt(e.target.dataset.id);
        currentEditingItem = items.find(item => item.id === id);
        if (currentEditingItem) {
            editItemUrlInput.value = currentEditingItem.url;
            editItemTagsInput.value = currentEditingItem.tags.join(', ');
            editItemTypeSelect.value = currentEditingItem.type;
            editItemFolderSelect.value = currentEditingItem.folder || '';
            editItemRatingInputs.forEach(radio => {
                radio.checked = parseInt(radio.value) === currentEditingItem.rating;
            });
            editItemModal.classList.remove('hidden');
        }
    }
});

// Event listener para o botão "Salvar Alterações" no modal de edição de item
saveItemChangesBtn.addEventListener('click', async () => {
    if (currentEditingItem) {
        const newUrl = editItemUrlInput.value.trim();
        const newTags = editItemTagsInput.value.trim().split(',').map(tag => tag.trim()).filter(tag => tag);
        const newType = editItemTypeSelect.value;
        const newFolder = editItemFolderSelect.value || null;
        
        let newRating = 0;
        editItemRatingInputs.forEach(radio => {
            if (radio.checked) {
                newRating = parseInt(radio.value);
            }
        });

        const isDuplicate = items.some(item => item.url === newUrl && item.id !== currentEditingItem.id);
        if (isDuplicate) {
            showCustomModal(window.translations[currentLanguage]['folderAlreadyExists'](newUrl), window.translations[currentLanguage]['okBtn']);
            return;
        }

        currentEditingItem.url = newUrl;
        currentEditingItem.tags = newTags;
        currentEditingItem.type = newType;
        currentEditingItem.folder = newFolder;
        currentEditingItem.rating = newRating;
        
        if (newUrl !== currentEditingItem.url) {
            currentEditingItem.metadata = await fetchMetadata(newUrl);
        }
        newTags.forEach(tag => {
            if (!savedTags.includes(tag)) {
                savedTags.push(tag);
            }
        });

        localStorage.setItem('savedTags', JSON.stringify(savedTags));
        localStorage.setItem('items', JSON.stringify(items));
        renderItems();
        editItemModal.classList.add('hidden');
        currentEditingItem = null;
        updateSavedTagsList();
        updateFolderSelects();
        updateDashboard();
    }
});

// Event listener para o botão "Settings" (alterna a visibilidade do painel de configurações)
settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
});

// Event listener para o botão "Toggle Dark Theme"
toggleThemeBtn.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    applyTheme();
});

// Event listener para o botão "Collapse/Expand Folders"
toggleFoldersBtn.addEventListener('click', () => {
    foldersListContainer.classList.toggle('hidden');
    if (foldersListContainer.classList.contains('hidden')) {
        toggleFoldersBtn.textContent = window.translations[currentLanguage]['expandFoldersBtn'];
    } else {
        toggleFoldersBtn.textContent = window.translations[currentLanguage]['collapseFoldersBtn'];
    }
});

// Event listener para o botão "Clear All Items"
clearItemsBtn.addEventListener('click', () => {
    showConfirmModal(window.translations[currentLanguage]['confirmClearAllItems'], () => {
        items = [];
        localStorage.setItem('items', JSON.stringify(items));
        renderItems();
        updateFolderSelects();
        updateDashboard();
    }, window.translations[currentLanguage]['yesBtn'], window.translations[currentLanguage]['noBtn']);
});

// Event listener para o botão "Manage Data" (abre o modal de gerenciamento de dados)
manageDataBtn.addEventListener('click', () => {
    manageDataModal.classList.remove('hidden');
});

// Event listener para o botão "Exportar Dados" dentro do modal de gerenciamento de dados
exportDataOptionBtn.addEventListener('click', () => {
    const data = {
        items,
        folders,
        savedTags,
        theme,
        currentLanguage
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    manageDataModal.classList.add('hidden');

    // Verifica se estamos em um ambiente Electron (Nativefier)
    if (typeof require !== 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.electron) {
        showLoadingMessage(window.translations[currentLanguage]['exportingData'], 5000); // Use translation for loading message

        setTimeout(() => {
            require('electron').shell.openExternal(url)
                .then(() => {
                    console.log('JSON export opened in external browser after delay.');
                })
                .catch(err => {
                    console.error('Failed to open JSON export in external browser:', err);
                    showCustomModal(window.translations[currentLanguage]['exportFailed'], window.translations[currentLanguage]['okBtn']); // Use translation
                })
                .finally(() => {
                    URL.revokeObjectURL(url);
                    hideLoadingMessage();
                });
        }, 5000);
    } else {
        // Fallback para ambientes que não são Electron (navegador web padrão)
        const a = document.createElement('a');
        a.href = url;
        a.download = 'liquid-glass-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});

// Event listener para o input de arquivo de importação (acionado quando um arquivo é selecionado)
importFileModalInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                importedDataCache = data;
                
                importItemsCheckbox.checked = true;
                importFoldersCheckbox.checked = true;
                importTagsCheckbox.checked = true;
                importThemeCheckbox.checked = true;
                importLanguageCheckbox.checked = true;

                manageDataModal.classList.add('hidden');
                importSelectionModal.classList.remove('hidden');

            } catch (err) {
                console.error("Error parsing JSON file:", err);
                showCustomModal(window.translations[currentLanguage]['invalidJsonFile'], window.translations[currentLanguage]['okBtn']);
                importFileModalInput.value = '';
            }
        };
        reader.readAsText(file);
    }
});

// Event listener para o botão "Confirmar Importação" no modal de seleção de importação
confirmImportSelectionBtn.addEventListener('click', async () => {
    if (!importedDataCache) {
        showCustomModal(window.translations[currentLanguage]['noDataToImport'], window.translations[currentLanguage]['okBtn']); // Use translation
        return;
    }

    showLoadingMessage(window.translations[currentLanguage]['importingData']);
    
    const importItems = importItemsCheckbox.checked;
    const importFolders = importFoldersCheckbox.checked;
    const importTags = importTagsCheckbox.checked;
    const importTheme = importThemeCheckbox.checked;
    const importLanguage = importLanguageCheckbox.checked;

    showConfirmModal(window.translations[currentLanguage]['confirmImport'], async () => {
        if (importItems && importedDataCache.items && Array.isArray(importedDataCache.items)) {
            const newItems = [];
            for (const ni of importedDataCache.items) {
                if (!items.some(i => i.url === ni.url)) {
                    ni.rating = ni.rating !== undefined ? ni.rating : 0;
                    ni.accessHistory = ni.accessHistory || [];
                    if (!ni.metadata || !ni.metadata.title || (ni.metadata.image && ni.metadata.image.includes('placehold.co'))) {
                        ni.metadata = await fetchMetadata(ni.url);
                    }
                    newItems.push(ni);
                }
            }
            items = [...items, ...newItems];
        }

        if (importFolders && importedDataCache.folders && Array.isArray(importedDataCache.folders)) {
            const newFolders = importedDataCache.folders.filter(nf => !folders.some(f => f.name === nf.name));
            folders = [...folders, ...newFolders];
        }

        if (importTags && importedDataCache.savedTags && Array.isArray(importedDataCache.savedTags)) {
            const newSavedTags = importedDataCache.savedTags.filter(nst => !savedTags.includes(nst));
            savedTags = [...savedTags, ...newSavedTags];
        }

        if (importTheme && importedDataCache.theme) {
            theme = importedDataCache.theme;
        }

        if (importLanguage && importedDataCache.currentLanguage) {
            currentLanguage = importedDataCache.currentLanguage;
        }

        localStorage.setItem('items', JSON.stringify(items));
        localStorage.setItem('folders', JSON.stringify(folders));
        localStorage.setItem('savedTags', JSON.stringify(savedTags));
        localStorage.setItem('theme', theme); 
        localStorage.setItem('language', currentLanguage);

        applyTheme();
        updateFolderSelects();
        updateSavedTagsList();
        applyLanguage(currentLanguage);
        renderItems();
        updateDashboard();
        
        importSelectionModal.classList.add('hidden');
        importFileModalInput.value = '';
        importedDataCache = null;
        showLoadingMessage(window.translations[currentLanguage]['importSuccess'], 2000);

    }, () => {
        hideLoadingMessage();
        importSelectionModal.classList.add('hidden');
        importFileModalInput.value = '';
        importedDataCache = null;
        showCustomModal(window.translations[currentLanguage]['importCanceled'], window.translations[currentLanguage]['okBtn']);
    }, window.translations[currentLanguage]['yesBtn'], window.translations[currentLanguage]['noBtn']);
});

// Event listener para a mudança de seleção no dropdown de idioma
languageSelect.addEventListener('change', (e) => {
    applyLanguage(e.target.value);
});

// Event listener para o botão "Adicionar Tag"
addTagBtn.addEventListener('click', () => {
    const newTag = newTagInput.value.trim();
    if (newTag && !savedTags.includes(newTag)) {
        savedTags.push(newTag);
        newTagInput.value = '';
        updateSavedTagsList();
    } else if (newTag) {
        showCustomModal(window.translations[currentLanguage]['folderAlreadyExists'](newTag), window.translations[currentLanguage]['okBtn']);
    } else {
        showCustomModal(window.translations[currentLanguage]['newTagPlaceholder'], window.translations[currentLanguage]['okBtn']);
    }
});

// Event listener para edição e exclusão de tags na lista de tags
tagsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-tag-btn')) {
        const tagToEdit = e.target.dataset.tag;
        currentEditingTag = tagToEdit;
        editTagNameInput.value = tagToEdit;
        editTagModal.classList.remove('hidden');
    } else if (e.target.classList.contains('delete-tag-btn')) {
        const tagToDelete = e.target.dataset.tag;
        showConfirmModal(window.translations[currentLanguage]['confirmDeleteTag'](tagToDelete), () => { // Added translation for tag delete confirmation
            savedTags = savedTags.filter(tag => tag !== tagToDelete);
            items = items.map(item => {
                if (item.tags && item.tags.includes(tagToDelete)) {
                    return { ...item, tags: item.tags.filter(t => t !== tagToDelete) };
                }
                return item;
            });
            localStorage.setItem('items', JSON.stringify(items));
            updateSavedTagsList();
            renderItems();
        }, window.translations[currentLanguage]['yesBtn'], window.translations[currentLanguage]['noBtn']);
    }
});

// Event listener para salvar alterações de tag no modal de edição
saveTagChangesBtn.addEventListener('click', () => {
    const oldTag = currentEditingTag;
    const newTag = editTagNameInput.value.trim();

    if (newTag && newTag !== oldTag && savedTags.includes(newTag)) {
        showCustomModal(window.translations[currentLanguage]['folderAlreadyExists'](newTag), window.translations[currentLanguage]['okBtn']);
        return;
    }
    if (!newTag) {
        showCustomModal(window.translations[currentLanguage]['newTagPlaceholder'], window.translations[currentLanguage]['okBtn']);
        return;
    }

    savedTags = savedTags.map(tag => tag === oldTag ? newTag : tag);
    items = items.map(item => {
        if (item.tags) {
            return { ...item, tags: item.tags.map(tag => tag === oldTag ? newTag : tag) };
        }
        return item;
    });

    localStorage.setItem('items', JSON.stringify(items));
    updateSavedTagsList();
    renderItems();
    editTagModal.classList.add('hidden');
    currentEditingTag = null;
});

// Event listener para salvar alterações de pasta no modal de edição de pasta
saveFolderChangesBtn.addEventListener('click', () => {
    if (currentEditingFolder) {
        const oldFolderName = currentEditingFolder.name;
        const newFolderName = editFolderNameInput.value.trim();
        const newFolderColor = editFolderColorSelect.value;
        const newFolderIcon = editFolderIconSelect.value;

        if (newFolderName && newFolderName !== oldFolderName && folders.some(f => f.name === newFolderName)) {
            showCustomModal(window.translations[currentLanguage]['folderAlreadyExists'](newFolderName), window.translations[currentLanguage]['okBtn']);
            return;
        }
        if (!newFolderName) {
            showCustomModal(window.translations[currentLanguage]['folderNameEmpty'], window.translations[currentLanguage]['okBtn']);
            return;
        }

        currentEditingFolder.name = newFolderName;
        currentEditingFolder.color = newFolderColor;
        currentEditingFolder.icon = newFolderIcon;

        if (oldFolderName !== newFolderName) {
            items = items.map(item => {
                if (item.folder === oldFolderName) {
                    return { ...item, folder: newFolderName };
                }
                return item;
            });
        }
        localStorage.setItem('folders', JSON.stringify(folders));
        localStorage.setItem('items', JSON.stringify(items));
        updateFolderSelects();
        searchItems();
        editFolderModal.classList.add('hidden');
        currentEditingFolder = null;
    }
});

// Event listener para excluir pasta no modal de edição de pasta
deleteFolderFromModalBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentEditingFolder) {
        const folderName = currentEditingFolder.name;
        const linksInFolder = items.filter(item => item.folder === folderName).length;
        
        showConfirmModal(window.translations[currentLanguage]['confirmDeleteFolder'](folderName, linksInFolder), () => {
            folders = folders.filter(f => f.name !== folderName);
            items = items.map(item => {
                if (item.folder === folderName) {
                    return { ...item, folder: null };
                }
                return item;
            });
            localStorage.setItem('items', JSON.stringify(items));
            localStorage.setItem('folders', JSON.stringify(folders));
            updateFolderSelects();
            searchItems();
            editFolderModal.classList.add('hidden');
            currentEditingFolder = null;
        }, window.translations[currentLanguage]['yesBtn'], window.translations[currentLanguage]['noBtn']);
    }
});

// Adiciona event listeners para os botões de limpar input (o "X" dentro dos campos)
document.querySelectorAll('.clear-input-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const targetInputId = e.target.dataset.targetInput;
        const targetInput = document.getElementById(targetInputId);
        if (targetInput) {
            targetInput.value = '';
            if (targetInputId === 'item-url') {
                updatePreview('');
            }
            if (targetInputId.startsWith('search-')) {
                searchItems();
            }
        }
    });
});

// Define o valor inicial do select de idioma com o idioma atualmente salvo
languageSelect.value = currentLanguage;

// **Inicialização do Aplicativo:**
// Tudo dentro deste bloco é executado quando o DOM estiver completamente carregado.
document.addEventListener('DOMContentLoaded', () => {
    console.log("1. DOMContentLoaded: Iniciando aplicação."); //
    
    // Verifique se as variáveis globais de config.js estão acessíveis
    console.log("1.1. currentLanguage:", typeof currentLanguage !== 'undefined' ? currentLanguage : "UNDEFINED"); //
    console.log("1.2. CURRENT_APP_VERSION:", typeof CURRENT_APP_VERSION !== 'undefined' ? CURRENT_APP_VERSION : "UNDEFINED"); //

    applyTheme(); // Aplica o tema salvo ou padrão
    console.log("2. DOMContentLoaded: Tema aplicado.");
    
    updateFolderSelects(); // Carrega e renderiza as pastas
    console.log("3. DOMContentLoaded: Pastas atualizadas.");
    
    updateSavedTagsList(); // Carrega e renderiza as tags
    console.log("4. DOMContentLoaded: Tags salvas atualizadas.");
    
    applyLanguage(currentLanguage); // Aplica o idioma salvo ou padrão (importante para traduções iniciais)
    console.log("5. DOMContentLoaded: Idioma aplicado.");

    renderItems(); // Renderiza a lista inicial de itens
    updateDashboard(); // Renderiza os dados do dashboard
    console.log("6. Renderização inicial de itens e dashboard completa.");

    showTab('dashboard-tab'); // Define a aba "Dashboard" como a aba inicial visível
    console.log("7. Aba Dashboard ativada.");

    // Event listeners para os botões de scroll
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    goToBottomBtn.addEventListener('click', () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });

    // Mostra/oculta os botões de scroll com base na posição da rolagem
    window.addEventListener('scroll', () => {
        if (window.scrollY > 200) { // Mostra o botão "voltar ao topo" após 200px de rolagem
            backToTopBtn.classList.remove('hidden');
        } else {
            backToTopBtn.classList.add('hidden');
        }

        // Mostra o botão "ir para o fim" se não estiver no fim da página
        if ((window.innerHeight + window.scrollY) < document.body.offsetHeight - 200) { // 200px antes do fim
            goToBottomBtn.classList.remove('hidden');
        } else {
            goToBottomBtn.classList.add('hidden');
        }
    });
    
    // NEW: Adiciona o event listener para o botão de "Verificar Atualizações" (manual)
    // CAPTURE A REFERÊNCIA AO BOTÃO EXATAMENTE AQUI, DENTRO DO DOMContentLoaded.
    const checkUpdateBtn = document.getElementById('check-update-btn');
    
    if (checkUpdateBtn) {
        checkUpdateBtn.addEventListener('click', checkForUpdates);
        console.log("8. Listener para 'checkUpdateBtn' adicionado.");
    } else {
        console.warn("8. Botão 'check-update-btn' NÃO ENCONTRADO no DOM.");
    }

    // NEW: Automaticamente verifica por atualizações na inicialização do aplicativo
    // Descomente a linha abaixo para ativar a verificação automática.
    checkForUpdates(); 
    console.log("9. Verificação de atualizações iniciada.");
});