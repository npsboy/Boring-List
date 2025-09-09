
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {getFirestore, collection, doc, addDoc, deleteDoc, updateDoc, onSnapshot, getDoc} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAr026N4ukx-8v01Ay1Sgr8sCKSGnalaJU",
  authDomain: "boring-list-1df76.firebaseapp.com",
  projectId: "boring-list-1df76",
  storageBucket: "boring-list-1df76.firebasestorage.app",
  messagingSenderId: "179447196596",
  appId: "1:179447196596:web:a63cda0610a07d8884a0e1"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let listDisplay = document.getElementById('list');

let list = [];

function update_display() {
    if (list.length === 0) {
        listDisplay.innerHTML = "<p>Add task to get started.</p>";
        return;
    }
    let list_html = list.map(function(item, index){
        return `
            <div class="list-item">
                <input type="checkbox" id="item${index}" ${item.Completion ? 'checked' : ''} onchange="update_completion(${index}, this.checked)">
                <input type="text" ${item.label === "New task" ? `placeholder="New task" ` : `value="${item.label}"`} onchange="change_item(${index})">
                <div class="item_settings">
                    <img class="delete" src="delete.png" onclick="delete_item(${index})">
                </div>
            </div>
        `;
    });
    listDisplay.innerHTML = list_html.join('');
}


window.update_completion = function(index, isChecked) {
    list[index].Completion = isChecked;
    update_display();
    update_firestore_doc();
}


window.change_item = function(index) {
    let display_item = document.getElementById(`item${index}`);
    let inputField = display_item.parentElement.querySelector('input[type="text"]');
    list[index].label = inputField.value;
    update_display();
    update_firestore_doc();
}

window.delete_item = function(index) {
    list.splice(index, 1);
    update_display();
    update_firestore_doc();
}

window.add_task = function() {
    let new_task = {label: "New task", Completion: false};
    list.unshift(new_task);
    update_display();
    update_firestore_doc();
    setTimeout(() => {
        edit_item(list.length - 1);
    }, 100);
}


let checklistCollection = collection(db,"Checklists")
let docRef;
let id;
let list_name;

async function create_firestore_doc(name, pass, salt) {
    docRef = await addDoc(checklistCollection, {"name": name, "pass": pass, "salt": salt, "list": list})
    onSnapshot(docRef, function (docSnap) {
        list = docSnap.data().list
        update_display();
    })
    let url = new URL(window.location)
    url.searchParams.set("id", docRef.id)
    window.history.pushState({}, "", url)
}

async function update_firestore_doc() {
    await updateDoc(docRef, {list})
}

async function hash(p) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(p))
    )
  ).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateSalt(length = 16) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
}


function toggle_setup() {
    let darkener = document.querySelector('.darkener');
    let setup = document.getElementById('setup');
    let setupButton = document.querySelector('.setup button');
    darkener.style.display = (darkener.style.display === 'block') ? 'none' : 'block';
    setup.style.display = (setup.style.display === 'block') ? 'none' : 'block';
}

async function toggle_login() {
    let darkener = document.querySelector('.darkener');
    let login = document.getElementById('login');
    darkener.style.display = (darkener.style.display === 'block') ? 'none' : 'block';
    login.style.display = (login.style.display === 'block') ? 'none' : 'block';
    if (darkener.style.display === 'block' && docRef) {
        let docSnap = await getDoc(docRef);
        list_name = docSnap.data().name;
        // Only update the login card's list name display
        let loginListNameDisplay = document.querySelector('#login .list_name_display');
        loginListNameDisplay.textContent = list_name;
    }
}

window.setup = async function() {
    list_name = document.getElementById('list_name').value;
    let list_pass = document.getElementById('list_pass').value;
    if (!list_name) {
        alert("Please enter a list name.");
        return;
    }
    if (!list_pass) {
        create_firestore_doc(list_name, "", "");
    }
    else{
        let salt = generateSalt();
        let hashed_pass = await hash(list_pass + salt);
        create_firestore_doc(list_name, hashed_pass, salt);
    }
    toggle_setup();
    let list_name_display = document.querySelector('.list_name_display');
    list_name_display.textContent = list_name;
};

window.login = async function() {

    let login_pass = document.getElementById('login_pass').value;
    if (!login_pass) {
        alert("Please enter a password.");
        return;
    }
    let docSnap = await getDoc(docRef);
    let salt = docSnap.data().salt;
    let hashed_pass = await hash(login_pass + salt);
    if (hashed_pass === docSnap.data().pass) {
        list_name = docSnap.data().name;
        let list_name_displays = document.querySelectorAll('.list_name_display');
        list_name_displays.forEach(display => {
            display.textContent = list_name;
        });
        toggle_login();
        onSnapshot(docRef, function (docSnap) {
            list = docSnap.data().list
            update_display();
        })

    } else {
        alert("Incorrect password.");
    }
}

async function main() {
    let params = new URLSearchParams(window.location.search)
    id = params.get("id")
    if (id) {
        docRef = doc(checklistCollection, id)
        let docSnap = await getDoc(docRef);
        let pass = docSnap.data().pass
        if (pass != "") {
            toggle_login();
        }
        else {
            list_name = docSnap.data().name;
            let list_name_displays = document.querySelectorAll('.list_name_display');
            list_name_displays.forEach(display => {
                display.textContent = list_name;
            });
            onSnapshot(docRef, function (docSnap) {
                list = docSnap.data().list
                update_display();
            })
        }
    }
    else {
        toggle_setup();
    }
}

main()