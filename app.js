
const API = "https://script.google.com/macros/s/AKfycbzsaPD-DCytkzBtx2WYlwMMEYbmWoWR6qKJRPNBQTqVxQQuOLVudmfMbdEFKE-jX2nY/exec"

let user = null
let role = null

function login(){

const login = document.getElementById("login").value
const password = document.getElementById("password").value

fetch(API,{
method:"POST",
body:JSON.stringify({
action:"login",
login:login,
password:password
})
})
.then(r=>r.json())
.then(data=>{

if(data.status=="success"){

user = login
role = data.role

document.getElementById("loginScreen").classList.add("hidden")
document.getElementById("appScreen").classList.remove("hidden")

if(role=="admin"){
document.getElementById("adminTab").classList.remove("hidden")
}

}else{
document.getElementById("loginMsg").innerText="Erreur login"
}

})

}

function logout(){
location.reload()
}

function showTab(id){

document.querySelectorAll(".tab").forEach(t=>t.classList.add("hidden"))
const target = document.getElementById(id);
    if(target) {
        target.classList.remove("hidden");

}

function addPiece(){

const stock = document.getElementById("stockType").value
const type = document.getElementById("type").value
const designation = document.getElementById("designation").value
const quantite = document.getElementById("quantite").value
const emplacement = document.getElementById("emplacement").value

fetch(API,{
method:"POST",
body:JSON.stringify({
action:"addPiece",
stock:stock,
type:type,
designation:designation,
quantite:quantite,
emplacement:emplacement,
user:user
})
})
.then(r=>r.json())
.then(data=>{

if(data.status=="added"){
document.getElementById("addMsg").innerText="Pièce ajoutée"
}else{
document.getElementById("addMsg").innerText="Erreur"
}

})


