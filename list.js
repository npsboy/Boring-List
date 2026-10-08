// Firebase is loaded lazily (see init_backend) so the app still works from the
// local copy when the SDK or Firestore can't be reached.
const FIREBASE_APP_URL = "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
const FIRESTORE_URL = "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
const APP_CHECK_URL = "https://www.gstatic.com/firebasejs/12.2.1/firebase-app-check.js";
const RECAPTCHA_SITE_KEY = "6Lf8wuQtAAAAAPfF-CV-Df9iXUXyhsQJleKWrBxM";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAr026N4ukx-8v01Ay1Sgr8sCKSGnalaJU",
  authDomain: "boring-list-1df76.firebaseapp.com",
  projectId: "boring-list-1df76",
  storageBucket: "boring-list-1df76.firebasestorage.app",
  messagingSenderId: "179447196596",
  appId: "1:179447196596:web:a63cda0610a07d8884a0e1"
};

let fs = null; // firestore module, once loaded
let db = null;

async function init_backend() {
    if (db) return true;
    try {
        const [firebaseApp, firestore, appCheck] = await Promise.all([import(FIREBASE_APP_URL), import(FIRESTORE_URL), import(APP_CHECK_URL)]);
        const isNewApp = !firebaseApp.getApps().length;
        const app = isNewApp ? firebaseApp.initializeApp(firebaseConfig) : firebaseApp.getApp();
        if (isNewApp) {
            // On localhost App Check logs a debug token to the console; register it in
            // Firebase Console > App Check > Manage debug tokens
            if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
                self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
            }
            appCheck.initializeAppCheck(app, {
                provider: new appCheck.ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
                isTokenAutoRefreshEnabled: true
            });
        }
        db = firestore.getFirestore(app);
        fs = firestore;
        return true;
    } catch (e) {
        console.warn("Backend unavailable:", e);
        return false;
    }
}

function with_timeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
    ]);
}

let listDisplay = document.getElementById('list');

// format: [{label: "task", Completion: false}]
let list = [];
let id;
let list_name;
let list_pass = ""; // stored hashed password ("" = no password)
let list_salt = "";

// Local copy / sync state
let unlocked = false;   // user is allowed to view the list (no password, or logged in)
let dirty = false;      // local changes not yet confirmed by Firestore
let created = false;    // the doc is known to exist in Firestore
let edit_version = 0;
let syncing = false;
let sync_queued = false;
let listening = false;
let backend_online = false; // last known Firestore reachability, shown in the status indicator

function local_key() {
    return "boring-list:" + id;
}

function load_local() {
    try {
        return JSON.parse(localStorage.getItem(local_key()));
    } catch (e) {
        return null;
    }
}

function save_local() {
    try {
        localStorage.setItem(local_key(), JSON.stringify({
            name: list_name, pass: list_pass, salt: list_salt, list, dirty, created
        }));
    } catch (e) {
        console.warn("Couldn't save list locally:", e);
    }
}

function remove_local() {
    try { localStorage.removeItem(local_key()); } catch (e) {}
}

function apply_data(data) {
    list = data.list || [];
    list_name = data.name;
    list_pass = data.pass || "";
    list_salt = data.salt || "";
}

// Always-visible indicator: online & synced / saving / offline (saved locally).
function render_status() {
    let status = document.getElementById('sync_status');
    if (!unlocked) {
        status.textContent = "";
        status.className = "";
    } else if (!backend_online) {
        status.textContent = dirty ? "Offline - changes saved on this device, will upload when back online"
                                   : "Offline - showing copy saved on this device";
        status.className = "offline";
    } else if (dirty) {
        status.textContent = "Saving...";
        status.className = "saving";
    } else {
        status.textContent = "Online - synced";
        status.className = "online";
    }
}

function set_online(online) {
    backend_online = online;
    render_status();
}

// Save locally right away, then try to push to Firestore.
function persist() {
    edit_version++;
    dirty = true;
    save_local();
    render_status();
    sync();
}

async function sync() {
    if (!id || !unlocked) return;
    if (syncing) {
        sync_queued = true;
        return;
    }
    if (!(await init_backend())) {
        set_online(false);
        return;
    }
    start_listening();
    if (!dirty) {
        render_status();
        return;
    }
    syncing = true;
    render_status();
    let version = edit_version;
    try {
        await with_timeout(
            fs.setDoc(fs.doc(db, "Checklists", id),
                {name: list_name, pass: list_pass, salt: list_salt, list},
                {merge: true}),
            10000
        );
        created = true;
        if (version === edit_version) dirty = false;
        save_local();
        set_online(true);
    } catch (e) {
        console.warn("Sync failed, will retry:", e);
        set_online(false);
    } finally {
        syncing = false;
        if (sync_queued) {
            sync_queued = false;
            sync();
        }
    }
}

function start_listening() {
    if (listening || !db || !unlocked) return;
    listening = true;
    // includeMetadataChanges so we hear when Firestore drops to / recovers from cache (offline/online).
    fs.onSnapshot(fs.doc(db, "Checklists", id), {includeMetadataChanges: true}, function (docSnap) {
        set_online(!docSnap.metadata.fromCache);
        if (!docSnap.exists() || docSnap.metadata.hasPendingWrites) return;
        if (dirty) {
            // Our unsynced local changes win; push them instead.
            sync();
            return;
        }
        apply_data(docSnap.data());
        created = true;
        save_local();
        update_display();
    }, function (e) {
        console.warn("Lost connection to list:", e);
        listening = false;
        set_online(false);
    });
}

const LAST_LIST_KEY = "boring-list:last-id";

function get_last_id() {
    try { return localStorage.getItem(LAST_LIST_KEY); } catch (e) { return null; }
}

function set_last_id(value) {
    try {
        if (value) localStorage.setItem(LAST_LIST_KEY, value);
        else localStorage.removeItem(LAST_LIST_KEY);
    } catch (e) {}
}

function unlock() {
    unlocked = true;
    set_last_id(id);
    update_display();
    save_local();
    sync();
}

function update_display() {
    let list_name_display = document.querySelectorAll('.list_name_display');
    list_name_display.forEach(display => {
        display.textContent = list_name;
    });
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
}


window.update_completion = function(index, isChecked) {
    list[index].Completion = isChecked;
    update_display();
    persist();
}


window.change_item = function(index) {
    let display_item = document.getElementById(`item${index}`);
    let inputField = display_item.parentElement.querySelector('input[type="text"]');
    list[index].label = inputField.value.replace(/[<>]/g, "");
    update_display();
    persist();
}

window.delete_item = function(index) {
    list.splice(index, 1);
    update_display();
    persist();
}

window.add_task = function() {
    let new_task = {label: "New task", Completion: false};
    list.unshift(new_task);
    update_display();
    persist();
    setTimeout(() => {
        edit_item(list.length - 1);
    }, 100);
}

// Same shape as Firestore auto-IDs, so a list can be created while offline.
function generate_id(length = 20) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => chars[b % chars.length]).join("");
}

function create_list(name, pass, salt) {
    id = generate_id();
    apply_data({name, pass, salt, list});
    created = false;
    backend_online = navigator.onLine;
    let url = new URL(window.location)
    url.searchParams.set("id", id)
    window.history.pushState({}, "", url)
    dirty = true;
    unlock();
}

window.clearurl = function() {
    set_last_id(null);
    let url = new URL(window.location)
    url.searchParams.delete("id")
    window.history.pushState({}, "", url)
    window.location.reload();
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
    darkener.style.display = (darkener.style.display === 'block') ? 'none' : 'block';
    setup.style.display = (setup.style.display === 'block') ? 'none' : 'block';
}

function toggle_login() {
    let darkener = document.querySelector('.darkener');
    let login = document.getElementById('login');
    darkener.style.display = (darkener.style.display === 'block') ? 'none' : 'block';
    login.style.display = (login.style.display === 'block') ? 'none' : 'block';
    if (darkener.style.display === 'block') {
        // Only update the login card's list name display
        let loginListNameDisplay = document.querySelector('#login .list_name_display');
        loginListNameDisplay.textContent = list_name;
    }
}

window.setup = async function() {
    let list_name_input = document.getElementById('list_name');
    let password_input = document.getElementById('list_pass');

    let name = list_name_input.value;
    let password_value = password_input.value;

    if (!name) {
        alert("Please enter a list name.");
        return;
    }
    if (!password_value) {
        create_list(name, "", "");
    }
    else{
        let salt = generateSalt();
        create_list(name, await hash(password_value + salt), salt);
    }
    toggle_setup();
};

window.login = async function() {
    let password_input = document.getElementById('login_pass');
    let password_value = password_input.value;

    if (!password_value) {
        alert("Please enter a password.");
        return;
    }
    let inputHashedPassword = await hash(password_value + list_salt);

    if (inputHashedPassword === list_pass) {
        toggle_login();
        unlock();
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

    if (list_pass !== "") {
        password_instruction.textContent = "Old Password:";
    }
    else {
        password_instruction.innerHTML = "Setup Password:";
        new_password.style.display = "none";
        let change_password_text = document.getElementById('change_password_text');
        change_password_text.style.display = "none";
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
    let new_pass;

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
        persist();
        toggle_settings();
        return;
    }
    if (list_pass !== "") {
        // if there already is a password
        let old_password_input_hash = await hash(old_password_value + list_salt);
        if (old_password_input_hash !== list_pass) {
            alert("Incorrect old password.");
            return;
        }
        if (new_password_value && new_password_value.trim() !== "") {
            salt = generateSalt();
            new_pass = await hash(new_password_value + salt);
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
        new_pass = await hash(new_password_value + salt);
    }
    list_name = new_list_name;
    list_pass = new_pass;
    list_salt = salt;
    persist();
    toggle_settings();
}

window.toggle_error = function(message) {
    let darkener = document.querySelector('.darkener');
    let error = document.getElementById('error');
    if (message) {
        document.querySelector('#error h2').textContent = message.title;
        document.getElementById('error_message').textContent = message.text;
    }
    darkener.style.display = 'block';
    error.style.display = 'flex';
}

// Returns the doc data, null if it doesn't exist, or undefined if the backend is unreachable.
async function fetch_remote() {
    if (!(await init_backend())) return undefined;
    try {
        let docSnap = await with_timeout(fs.getDoc(fs.doc(db, "Checklists", id)), 8000);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (e) {
        console.warn("Couldn't fetch list:", e);
        return undefined;
    }
}

async function main() {
    // Retry pushing local changes whenever we might be back online.
    window.addEventListener("online", sync);
    window.addEventListener("offline", () => set_online(false));
    setInterval(() => { if (dirty || !listening) sync(); }, 15000);

    let params = new URLSearchParams(window.location.search)
    id = params.get("id")
    if (!id) {
        // Reopen the list that was last worked on.
        id = get_last_id();
        if (id) {
            let url = new URL(window.location)
            url.searchParams.set("id", id)
            window.history.replaceState({}, "", url)
        }
    }
    if (!id) {
        toggle_setup();
        init_backend(); // warm up
        return;
    }

    let local = load_local();
    let remote = await fetch_remote();

    if (remote === null && local && local.created) {
        // Deleted on the server; the local copy is stale.
        remove_local();
        local = null;
    }
    if (!local && remote === null) {
        toggle_error();
        console.log("Document not found");
        return;
    }
    if (!local && remote === undefined) {
        toggle_error({
            title: "Offline",
            text: "Can't reach the server, and this list isn't saved on this device yet. Try again when you're back online."
        });
        return;
    }

    if (local && (local.dirty || !remote)) {
        // Unsynced local changes (or no server copy) - the local copy wins.
        apply_data(local);
        dirty = local.dirty;
        created = local.created || !!remote;
    } else {
        apply_data(remote);
        created = true;
    }
    backend_online = remote !== undefined;

    if (list_pass !== "") {
        toggle_login();
    }
    else {
        unlock();
    }
}

main()
