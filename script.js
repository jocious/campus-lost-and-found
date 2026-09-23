let items = JSON.parse(localStorage.getItem("lostFoundItems")) || [];

const itemForm = document.getElementById("itemForm");
const itemsContainer = document.getElementById("itemsContainer");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");


function displayItems() {

    itemsContainer.innerHTML = "";

    let searchText = searchInput.value.toLowerCase();
    let selectedStatus = filterStatus.value;

    let filteredItems = items.filter(function(item) {

        let matchesSearch =
            item.name.toLowerCase().includes(searchText) ||
            item.location.toLowerCase().includes(searchText);

        let matchesStatus =
            selectedStatus === "all" ||
            item.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });


    if (filteredItems.length === 0) {

        itemsContainer.innerHTML =
            '<p class="no-items">No items found.</p>';

        return;
    }


    filteredItems.forEach(function(item) {

        let itemCard = document.createElement("div");

        itemCard.className = "item-card";

        itemCard.innerHTML = `
            <h3>${item.name}</h3>

            <p>
                <strong>Status:</strong>
                <span class="status">${item.status}</span>
            </p>

            <p>
                <strong>Description:</strong>
                ${item.description}
            </p>

            <p>
                <strong>Location:</strong>
                ${item.location}
            </p>

            <p>
                <strong>Reported by:</strong>
                ${item.reporter}
            </p>

            <p>
                <strong>Contact:</strong>
                ${item.contact}
            </p>

            <button
                class="delete-button"
                onclick="deleteItem(${item.id})">
                Delete
            </button>
        `;

        itemsContainer.appendChild(itemCard);
    });
}


itemForm.addEventListener("submit", function(event) {

    event.preventDefault();


    let itemName = document.getElementById("itemName").value;
    let itemStatus = document.getElementById("itemStatus").value;
    let itemDescription = document.getElementById("itemDescription").value;
    let itemLocation = document.getElementById("itemLocation").value;
    let reporterName = document.getElementById("reporterName").value;
    let contactNumber = document.getElementById("contactNumber").value;


    let newItem = {

        id: Date.now(),

        name: itemName,

        status: itemStatus,

        description: itemDescription,

        location: itemLocation,

        reporter: reporterName,

        contact: contactNumber
    };


    items.push(newItem);


    localStorage.setItem(
        "lostFoundItems",
        JSON.stringify(items)
    );


    itemForm.reset();

    displayItems();

    alert("Item report added successfully!");
});


function deleteItem(id) {

    let confirmDelete =
        confirm("Are you sure you want to delete this report?");

    if (confirmDelete) {

        items = items.filter(function(item) {

            return item.id !== id;

        });


        localStorage.setItem(
            "lostFoundItems",
            JSON.stringify(items)
        );


        displayItems();
    }
}


searchInput.addEventListener(
    "input",
    displayItems
);


filterStatus.addEventListener(
    "change",
    displayItems
);


displayItems();