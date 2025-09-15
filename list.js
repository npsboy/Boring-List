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

// format: [{label: "task", Completion: false}]
let list = [];

function update_display() {
    if (list.length === 0) {
        listDisplay.innerHTML = "<p>Add task to get started.</p>";
        return;
    }
    let list_html = list.map(function(item, index){
        let escapedLabel = item.label.replace(/"/g, "&quot;");
        return `
            <div class="list-item">
                <input type="checkbox" id="item${index}" ${item.Completion ? 'checked' : ''} onchange="update_completion(${index}, this.checked)">
                <input type="text" ${item.label === "New task" ? 
                    `placeholder="New task" ` : `value="${escapedLabel}"`} 
                    onchange="change_item(${index})"
                    style="${item.Completion ? 'text-decoration: line-through;' : ''}"
                >
                <div class="item_settings">
                    <img class="delete" src="images/delete.png" onclick="delete_item(${index})">
                </div>
            </div>
        `;
    });
    listDisplay.innerHTML = list_html.join('');
    let list_name_display = document.querySelectorAll('.list_name_display');
    list_name_display.forEach(display => {
        display.textContent = list_name;
    });
}


window.update_completion = function(index, isChecked) {
    list[index].Completion = isChecked;
    update_display();
    update_firestore_doc();
}


window.change_item = function(index) {
    let display_item = document.getElementById(`item${index}`);
    let inputField = display_item.parentElement.querySelector('input[type="text"]');
    list[index].label = inputField.value.replace(/[<>]/g, "");
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
let hashedPassword = ""; // Global variable to store current hashed password

async function create_firestore_doc(name, pass, salt) {
    docRef = await addDoc(checklistCollection, {"name": name, "pass": pass, "salt": salt, "list": list})
    onSnapshot(docRef, function (docSnap) {
        list = docSnap.data().list
        list_name = docSnap.data().name;
        update_display();
    })
    let url = new URL(window.location)
    url.searchParams.set("id", docRef.id)
    window.history.pushState({}, "", url)
}

window.clearurl = function() {
    let url = new URL(window.location)
    url.searchParams.delete("id")
    window.history.pushState({}, "", url)
    window.location.reload();
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
    let list_name_input = document.getElementById('list_name');
    let password_input = document.getElementById('list_pass');
    
    list_name = list_name_input.value;
    let password_value = password_input.value;
    
    if (!list_name) {
        alert("Please enter a list name.");
        return;
    }
    if (!password_value) {
        hashedPassword = "";
        create_firestore_doc(list_name, "", "");
    }
    else{
        let salt = generateSalt();
        hashedPassword = await hash(password_value + salt);
        create_firestore_doc(list_name, hashedPassword, salt);
    }
    toggle_setup();
    let list_name_display = document.querySelector('.list_name_display');
    list_name_display.textContent = list_name;
};

window.login = async function() {
    let password_input = document.getElementById('login_pass');
    let password_value = password_input.value;
    
    if (!password_value) {
        alert("Please enter a password.");
        return;
    }
    let docSnap = await getDoc(docRef);
    let salt = docSnap.data().salt;
    let inputHashedPassword = await hash(password_value + salt);
    
    if (inputHashedPassword === docSnap.data().pass) {
        hashedPassword = inputHashedPassword; // Store the hashed password globally
        list_name = docSnap.data().name;
        let list_name_displays = document.querySelectorAll('.list_name_display');
        list_name_displays.forEach(display => {
            display.textContent = list_name;
        });
        toggle_login();
        onSnapshot(docRef, function (docSnap) {
            list = docSnap.data().list
            list_name = docSnap.data().name;
            update_display();
        })

    } else {
        alert("Incorrect password. Please try again.");
    }
}

window.toggle_share = function() {
    let darkener = document.querySelector('.darkener');
    let share = document.getElementById('share');
    darkener.style.display = (darkener.style.display === 'block') ? 'none' : 'block';
    share.style.display = (share.style.display === 'block') ? 'none' : 'block';

    function darkenerClickHandler(e) {
        if (!share.contains(e.target)) {
            darkener.style.display = 'none';
            share.style.display = 'none';
            darkener.removeEventListener('click', darkenerClickHandler);
        }
    }

    darkener.addEventListener('click', darkenerClickHandler);
}

window.share = async function() {
    toggle_share();
    let share_link = document.getElementById('share_link');
    share_link.value = window.location.href;
}

window.copyLink = function() {
    let copy_status = document.getElementById('copy_status');
    let share_link = document.getElementById('share_link');
    share_link.select();
    share_link.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard.writeText(share_link.value);
    copy_status.textContent = "Link copied!";
    setTimeout(() => {
        copy_status.textContent = "";
    }, 2000);
}

window.toggle_settings = function() {
    let darkener = document.querySelector('.darkener');
    let settings = document.getElementById('settings');
    darkener.style.display = (darkener.style.display === 'block') ? 'none' : 'block';
    settings.style.display = (settings.style.display === 'block') ? 'none' : 'block';

    function darkenerClickHandler(e) {
        if (!settings.contains(e.target)) {
            darkener.style.display = 'none';
            settings.style.display = 'none';
            darkener.removeEventListener('click', darkenerClickHandler);
        }
    }

    darkener.addEventListener('click', darkenerClickHandler);
}

window.settings = function() {
    toggle_settings();
    let list_name_change_input = document.getElementById('list_name_change');
    let password_instruction = document.getElementById('password_instruction');
    let new_password = document.getElementById('new_password');
    
    list_name_change_input.value = list_name;

    if (hashedPassword !== "") {
        password_instruction.textContent = "Old Password:";
    }
    else {
        password_instruction.innerHTML = "Setup Password:";
        new_password.style.display = "none";
    }
}

window.save_settings = async function() {
    let list_name_change_input = document.getElementById('list_name_change');
    let old_password_input = document.getElementById('old_password_input');
    let new_password_input = document.getElementById('new_list_pass');
    
    let new_list_name = list_name_change_input.value;
    let old_password_value = old_password_input.value;
    let new_password_value = new_password_input.value;

    let salt;

    let list_name_display = document.querySelectorAll('.list_name_display');
    list_name_display.forEach(display => {
        display.textContent = new_list_name;
    });

    if (!new_list_name) {
        alert("Please enter a list name.");
        return;
    }
    if (!old_password_value || old_password_value.trim() === "") {
        list_name = new_list_name;
        await updateDoc(docRef, {
            name: new_list_name,
        });
        toggle_settings();
        return;
    }
    if (hashedPassword !== "") {
        // if there already is a password
        salt = (await getDoc(docRef)).data().salt;
        let old_password_input_hash = await hash(old_password_value + salt);
        if (old_password_input_hash !== hashedPassword) {
            alert("Incorrect old password.");
            return;
        }
        if (new_password_value && new_password_value.trim() !== "") {
            salt = generateSalt();
            hashedPassword = await hash(new_password_value + salt);
        }
        else {
            alert("Please enter a new password.");
            return;
        }
    }
    else {
        // If no password is set, ie: first time setup
        new_password_value = old_password_value; // For setting password first time
        if (!new_password_value || new_password_value.trim() === "") {
            alert("Please enter a password.");
            return;
        }
        salt = generateSalt();
        hashedPassword = await hash(new_password_value + salt);
    }
    list_name = new_list_name;
    await updateDoc(docRef, {
        name: new_list_name,
        pass: hashedPassword,
        salt: salt
    });
    toggle_settings();
}

window.toggle_error = function() {
    let darkener = document.querySelector('.darkener');
    let error = document.getElementById('error');
    darkener.style.display = 'block';
    error.style.display = 'flex';
}

async function main() {
    let params = new URLSearchParams(window.location.search)
    id = params.get("id")
    if (id) {
        docRef = doc(checklistCollection, id)
        let docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            toggle_error();
            console.log("Document not found");
            return;
        }
        let storedPassword = docSnap.data().pass
        if (storedPassword != "") {
            toggle_login();
        }
        else {
            hashedPassword = ""; // No password set
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