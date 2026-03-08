const API = "https://script.google.com/macros/s/AKfycbzKw-P-vqeQsrzYjI1CRvklm7f3KGaAHZj-o2ke52DnRFmwnGv_uwgLrjHed1wvOa7N/exec";

let user = null;
let role = null;

function login() {
    const loginVal = document.getElementById("login").value;
    const passwordVal = document.getElementById("password").value;

    fetch(API, {
        method: "POST",
        body: JSON.stringify({
            action: "login",
            login: loginVal,
            password: passwordVal
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
    const body = {
        action: "addPiece",
        stock: document.getElementById("stockType").value,
        type: document.getElementById("type").value,
        designation: document.getElementById("designation").value,
        quantite: document.getElementById("quantite").value,
        emplacement: document.getElementById("emplacement").value
    };

    fetch(API, { method: "POST", body: JSON.stringify(body) })
    .then(r => r.json())
    .then(data => {
        if(data.status === "added") {
            document.getElementById("addMsg").innerText = "Pièce ajoutée !";
            loadStock();
        }
    });
}

function showTab(id) {
    document.querySelectorAll(".tab").forEach(t => t.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

function logout() { location.reload(); }
