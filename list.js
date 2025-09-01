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


function update_completion(index, isChecked) {
    list[index].Completion = isChecked;
    update_display();
}

function edit_item(index) {
    let display_item = document.getElementById(`item${index}`);
    let inputField = display_item.parentElement.querySelector('input[type="text"]');
    inputField.focus();
    inputField.removeAttribute('readonly');
    inputField.addEventListener('blur', function handler() {
        inputField.setAttribute('readonly', true);
        inputField.removeEventListener('blur', handler);
    });
}

function change_item(index) {
    let display_item = document.getElementById(`item${index}`);
    let inputField = display_item.parentElement.querySelector('input[type="text"]');
    list[index].label = inputField.value;
    update_display();
}

function delete_item(index) {
    list.splice(index, 1);
    update_display();
}

function add_task() {
    let new_task = {label: "New task", Completion: false};
    list.push(new_task);
    update_display();
}


