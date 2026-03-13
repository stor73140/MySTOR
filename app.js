const API = "https://script.google.com/macros/s/AKfycbwX1GEkfO-u0l9FGk_0-Fo-hvs-h2y1SytuPk1uKmyJokWLoXp0alwoQE3tqJaOPMnj/exec";

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
    fetch(API, {
        method: "POST",
        body: JSON.stringify({ action: "updateQty", type: type, id: id, delta: delta })
    })
    .then(() => loadStock()); // Rafraîchit la liste
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
    fetch(API, {
        method: "POST",
        body: JSON.stringify({ action: "getPlaces" })
    })
    .then(r => r.json())
    .then(data => {
        const select = document.getElementById("emplacement");
        if (!select) return;

        // VERIFICATION : Est-ce que 'data' est bien une liste [] ?
        if (Array.isArray(data)) {
            select.innerHTML = '<option value="">Sélectionner un emplacement...</option>';
            data.forEach(place => {
                let opt = document.createElement("option");
                opt.value = place.name;
                opt.innerText = place.name;
                select.appendChild(opt);
            });
        } else {
            // Si c'est un message d'erreur, on l'affiche pour comprendre
            console.error("Le serveur n'a pas renvoyé une liste, mais ceci :", data);
            select.innerHTML = '<option value="">Erreur de chargement</option>';
        }
    })
    .catch(err => {
        console.error("Erreur réseau ou JSON mal formé :", err);
    });
}
function logout() { location.reload(); }
function loadTypes() {
    fetch(API, {
        method: "POST",
        body: JSON.stringify({ action: "getTypes" })
    })
    .then(r => r.json())
    .then(data => {
        const select = document.getElementById("type");
        if (!select) return;

        if (Array.isArray(data)) {
            select.innerHTML = '<option value="">Sélectionner un type...</option>';
            data.forEach(item => {
                let opt = document.createElement("option");
                opt.value = item.name;
                opt.innerText = item.name;
                select.appendChild(opt);
            });
        }
    })
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
    if (results.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">Aucun résultat</p>';
        return;
    }

    container.innerHTML = results.map(item => `
        <div class="stock-card">
            <div class="item-details">
                <span class="item-name">${item.designation}</span>
                <span class="item-meta">${item.type} | ${item.emplacement}</span>
            </div>
            <div class="qty-control">
                <button class="btn-mini" onclick="updateQty('${item.category}', '${item.id}', -1)">-</button>
                <span id="qty-${item.id}" style="font-weight:bold; min-width:20px; text-align:center">${item.quantite}</span>
                <button class="btn-mini" onclick="updateQty('${item.category}', '${item.id}', 1)">+</button>
            </div>
        </div>
    `).join('');
}
