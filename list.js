
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {getFirestore, collection, doc, addDoc, deleteDoc, updateDoc, onSnapshot} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
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
    let list_html = list.map(function(item, index){
        return `
            <div class="list-item">
                <input type="checkbox" id="item${index}" ${item.Completion ? 'checked' : ''} onchange="update_completion(${index}, this.checked)">
                <input type="text" value="${item.label}" onchange="change_item(${index})" readonly>
                <div class="item_settings">
                    <img class="delete" src="delete.png" onclick="delete_item(${index})">
                    <img class="edit" src="edit_icon.png" onclick="edit_item(${index})">
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

window.edit_item = function(index) {
    let display_item = document.getElementById(`item${index}`);
    let inputField = display_item.parentElement.querySelector('input[type="text"]');
    inputField.focus();
    inputField.removeAttribute('readonly');
    setTimeout(() => {
        inputField.addEventListener('blur', function handler() {
            inputField.setAttribute('readonly', true);
            inputField.removeEventListener('blur', handler);
        });
    }, 50)
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
    list.push(new_task);
    update_display();
    update_firestore_doc();
setTimeout(() => {
        edit_item(list.length - 1);
    }, 100);
}


let checklistCollection = collection(db,"Checklists")
let docRef;
let id;

async function create_firestore_doc() {
    docRef = await addDoc(checklistCollection,{list})
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


function main() {
    let params = new URLSearchParams(window.location.search)
    id = params.get("id")
    if (id) {
        docRef = doc(checklistCollection, id)
        onSnapshot(docRef, function (docSnap) {
        list = docSnap.data().list
        update_display();
    })
    }
    else {
        create_firestore_doc()
    }
}

main()