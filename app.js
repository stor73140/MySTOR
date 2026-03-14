const API = "https://script.google.com/macros/s/AKfycbzaxl0M4IMx1GKELa19ntSsbMQyLIbbV3jWyFdZbCu_5LJSGwCue_LahH0HYCs5DOhI/exec";

let user = null;
let role = null;

function login() {
    const loginVal = document.getElementById("login").value;
    const passwordVal = document.getElementById("password").value;

    fetch(API, {
        method: "POST",
        body: JSON.stringify({
            action: "login",
            user: loginVal,
            pass: passwordVal
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "success") {
            user = loginVal;
            role = data.role;
            document.getElementById("loginScreen").classList.add("hidden");
            document.getElementById("appScreen").classList.remove("hidden");
            if (role === "admin") document.getElementById("adminTab").classList.remove("hidden");
            loadStock(); // Charge les données dès la connexion
        } else {
            document.getElementById("loginMsg").innerText = "Identifiants incorrects";
        }
    })
    .catch(err => console.error("Erreur login:", err));
}

function loadStock() {
    fetch(API, {
        method: "POST",
        body: JSON.stringify({ action: "getStock" })
    })
    .then(r => r.json())
    .then(data => {
        renderTable("mecaList", data.meca, "meca");
        renderTable("elecList", data.elec, "elec");
    });
}

function renderTable(divId, items, type) {
    const container = document.getElementById(divId);
    if (!items || items.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:gray;'>Aucun article</p>";
        return;
    }

    let html = "";
    items.forEach(item => {
        html += `
        <div class="stock-card">
            <div class="item-details">
                <span class="item-name">${item.designation}</span>
                <span class="item-meta">${item.type} • Empl: ${item.emplacement}</span>
            </div>
            <div class="qty-control">
                <button class="btn-mini" onclick="updateQty('${type}', '${item.id}', -1)">-</button>
                <span class="qty-val">${item.quantite}</span>
                <button class="btn-mini" onclick="updateQty('${type}', '${item.id}', 1)">+</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function updateQty(type, id, delta) {
    const qtySpan = document.getElementById(`qty-${id}`);
    const itemName = qtySpan.closest('.stock-card').querySelector('.item-name').innerText; // Récupère le nom pour l'historique

    fetch(API, {
        method: "POST",
        body: JSON.stringify({ 
            action: "updateQty", 
            type: type, 
            id: id, 
            delta: delta,
            user: user, // Envoie le nom de l'utilisateur connecté
            designation: itemName // Envoie le nom de la pièce
        })
    }).then(() => {
        loadStock();
        if (role === 'admin') loadHistory(); // Rafraîchit l'historique si on est admin
    });
}

function addPiece() {
    const stockType = document.getElementById("stockType").value;
    
    const itemData = {
        stock: stockType,
        type: document.getElementById("type").value,
        designation: document.getElementById("designation").value,
        quantite: document.getElementById("quantite").value,
        emplacement: document.getElementById("emplacement").value
    };

    // On emballe les données pour que le script Google s'y retrouve
    const body = {
        action: "addPiece",
        type: stockType, // Le script Google attend 'data.type'
        item: itemData   // Le script Google attend 'data.item'
    };

    fetch(API, { 
        method: "POST", 
        body: JSON.stringify(body) 
    })
    .then(r => r.json())
    .then(data => {
        if(data.status === "added") {
            document.getElementById("addMsg").innerText = "✅ Pièce ajoutée !";
            loadStock();
            // Optionnel : vider les champs après l'ajout
            document.getElementById("designation").value = "";
            document.getElementById("quantite").value = "";
        }
    })
    .catch(err => console.error("Erreur lors de l'ajout :", err));
}

// 1. CHARGEMENT AUTO : Modifier la fonction showTab pour charger le stock
function showTab(id) {
    document.querySelectorAll(".tab").forEach(t => t.classList.add("hidden"));
    const target = document.getElementById(id);
    if (target) {
        target.classList.remove("hidden");
        if (id === 'meca' || id === 'elec') {
            loadStock();
        }
        if (id === 'add') {
            loadEmplacements();
            loadTypes();
        }
        if (id === 'searchTab') { 
            prepareSearch(); 
        }
        if (id === 'admin') { 
            loadHistory(); }
    }
}


// 2. RECHERCHE INTELLIGENTE
function filterStock(type) {
    const query = document.getElementById(type === 'meca' ? 'searchMeca' : 'searchElec').value.toLowerCase();
    const containerId = type === 'meca' ? 'mecaList' : 'elecList';
    const cards = document.getElementById(containerId).getElementsByClassName('stock-card');

    for (let card of cards) {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(query) ? "" : "none";
    }
}

// 3. MENU DÉROULANT DES EMPLACEMENTS
function loadEmplacements() {
    fetch(API, { method: "POST", body: JSON.stringify({ action: "getPlaces" }) })
    .then(r => r.json())
    .then(data => {
        const select = document.getElementById("emplacement");
        const adminList = document.getElementById("adminPlacesList"); // Div à créer dans l'onglet ajouter
        
        select.innerHTML = '<option value="">Sélectionner un lieu...</option>';
        let listHtml = "";

        data.forEach(item => {
            select.innerHTML += `<option value="${item.name}">${item.name}</option>`;
            if (role === 'admin') {
                // Utilise l'action 'deletePlace' pour le script Google
                listHtml += `<div class="admin-item">${item.name} <span onclick="deleteListOption('deletePlace', '${item.name.replace(/'/g, "\\'")}')">🗑️</span></div>`;
            }
        });
        if (adminList) adminList.innerHTML = listHtml;
    });
}
function logout() { location.reload(); }
// Exemple pour les types (faire la même logique pour les emplacements)
function loadTypes() {
    fetch(API, { method: "POST", body: JSON.stringify({ action: "getTypes" }) })
    .then(r => r.json())
    .then(data => {
        const select = document.getElementById("type");
        const adminList = document.getElementById("adminTypesList"); // Crée ce div dans ton HTML
        
        select.innerHTML = '<option value="">Sélectionner un type...</option>';
        let listHtml = "";

        data.forEach(item => {
            select.innerHTML += `<option value="${item.name}">${item.name}</option>`;
            if (role === 'admin') {
                listHtml += `<div class="admin-item">${item.name} <span onclick="deleteListOption('deleteType', '${item.name}')">🗑️</span></div>`;
            }
        });
        if (adminList) adminList.innerHTML = listHtml;
    });

    .catch(err => console.error("Erreur chargement types:", err));
}
let fullStockData = []; // Stockage global pour la recherche

// Charge les filtres et prépare les données quand on ouvre l'onglet
function prepareSearch() {
    // On récupère tout le stock (meca + elec)
    fetch(API, {
        method: "POST",
        body: JSON.stringify({ action: "getStock" })
    })
    .then(r => r.json())
    .then(data => {
        fullStockData = [...data.meca.map(i => ({...i, category:'meca'})), 
                         ...data.elec.map(i => ({...i, category:'elec'}))];
        loadFilterOptions();
    });
}

function loadFilterOptions() {
    // On remplit les filtres Type et Emplacement à partir de ce qu'on a déjà chargé
    const types = [...new Set(fullStockData.map(item => item.type))];
    const places = [...new Set(fullStockData.map(item => item.emplacement))];

    const typeSelect = document.getElementById("filterType");
    const placeSelect = document.getElementById("filterPlace");

    typeSelect.innerHTML = '<option value="">Tous les types</option>' + 
        types.map(t => `<option value="${t}">${t}</option>`).join('');
    
    placeSelect.innerHTML = '<option value="">Tous les lieux</option>' + 
        places.map(p => `<option value="${p}">${p}</option>`).join('');
}

function advancedSearch() {
    const query = document.getElementById("globalSearch").value.toLowerCase();
    const typeF = document.getElementById("filterType").value;
    const placeF = document.getElementById("filterPlace").value;

    const filtered = fullStockData.filter(item => {
        const matchName = item.designation.toLowerCase().includes(query);
        const matchType = typeF === "" || item.type === typeF;
        const matchPlace = placeF === "" || item.emplacement === placeF;
        return matchName && matchType && matchPlace;
    });

    renderSearchResults(filtered);
}

function renderSearchResults(results) {
    const container = document.getElementById("searchResultList");
    container.innerHTML = results.map(item => {
        // Bouton supprimer visible uniquement pour l'admin
        const deleteBtn = (role === 'admin') ? 
            `<button class="btn-delete" onclick="deleteItem('${item.category}', '${item.id}', '${item.designation.replace(/'/g, "\\'")}')">🗑️</button>` : '';

        return `
        <div class="stock-card">
            <div class="item-details">
                <span class="item-name">${item.designation}</span>
                <span class="item-meta">${item.type} | ${item.emplacement}</span>
            </div>
            <div class="qty-control">
                ${deleteBtn}
                <button class="btn-mini" onclick="updateQty('${item.category}', '${item.id}', -1)">-</button>
                <span id="qty-${item.id}">${item.quantite}</span>
                <button class="btn-mini" onclick="updateQty('${item.category}', '${item.id}', 1)">+</button>
            </div>
        </div>`;
    }).join('');
}
function addToList(sheetName, value) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  sheet.appendRow([value]);
  return json({status: "success"});
}

function manageUsers(mode, userData) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("users");
  if (mode === "add") {
    sheet.appendRow([userData.login, userData.pass, userData.role]);
    return json({status: "success"});
  }
}

function getHistory() {
  const sheet = SpreadsheetApp.getActive().getSheetByName("historique");
  if (!sheet) return json([]);
  const data = sheet.getRange(2, 1, Math.min(20, sheet.getLastRow()), 4).getValues();
  return json(data.reverse()); // Les plus récents en premier
}
function addListOption(action, inputId) {
    const val = document.getElementById(inputId).value;
    if (!val) return;
    fetch(API, {
        method: "POST",
        body: JSON.stringify({ action: action, name: val })
    }).then(() => {
        alert("Ajouté avec succès !");
        document.getElementById(inputId).value = "";
    });
}

function manageUser(action) {
    const userObj = {
        login: document.getElementById("newUserLogin").value,
        pass: document.getElementById("newUserPass").value,
        role: document.getElementById("newUserRole").value
    };
    fetch(API, {
        method: "POST",
        body: JSON.stringify({ action: action, user: userObj })
    }).then(() => alert("Utilisateur créé !"));
}

function loadHistory() {
    fetch(API, { method: "POST", body: JSON.stringify({ action: "getHistory" }) })
    .then(r => r.json())
    .then(data => {
        const div = document.getElementById("historyDisplay");
        div.innerHTML = data.map(h => `<div><b>${new Date(h[0]).toLocaleDateString()}</b>: ${h[1]} a fait ${h[2]} sur ${h[3]}</div>`).join('<hr>');
    });
}
let allUsers = [];

function loadUsers() {
    fetch(API, { method: "POST", body: JSON.stringify({ action: "getUsers" }) }) // Crée l'action getUsers dans ton script Google
    .then(r => r.json())
    .then(data => {
        allUsers = data;
        renderUsers(data);
    });
}

function renderUsers(list) {
    const container = document.getElementById("userListDisplay");
    container.innerHTML = list.map(u => `
        <div class="admin-item">
            <span>${u.login} (${u.role})</span>
            <button onclick="deleteListOption('deleteUser', '${u.login}')">🗑️</button>
        </div>
    `).join('');
}

function filterUsers() {
    const q = document.getElementById("searchUser").value.toLowerCase();
    const filtered = allUsers.filter(u => u.login.toLowerCase().includes(q));
    renderUsers(filtered);
}
