const API = "https://script.google.com/macros/s/AKfycbyETN3lX9p8PMNFBuIVOHVZehbxJ3-yjUEnSwem5KLxGK4stvjd4gHcLP4f3mCmUvFR/exec";

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
        // Si on ouvre un onglet de stock, on rafraîchit les données
        if (id === 'meca' || id === 'elec') {
            loadStock();
        }
        // Si on ouvre l'onglet d'ajout, on charge les emplacements
        if (id === 'add') {
            loadEmplacements();
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
