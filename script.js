
// =========================================================
// CAMPUS LOST & FOUND
// COMMIT 1: IMPROVE LOST AND FOUND REPORTS
// =========================================================


// Loads saved reports from the browser's localStorage.
// The existing key is preserved so previously saved reports remain available.
let items = JSON.parse(localStorage.getItem("lostFoundItems")) || [];


// Gets the HTML elements used by the application.
const itemForm = document.getElementById("itemForm");
const itemsContainer = document.getElementById("itemsContainer");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const reportDateInput = document.getElementById("reportDate");


// =========================================================
// DATE HELPER
// =========================================================

// Returns today's date in YYYY-MM-DD format using the computer's local time.
function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// =========================================================
// SAVE REPORTS
// =========================================================

// Saves all reports as JSON text in localStorage.
// JSON.stringify converts the JavaScript array into text for storage.
function saveItems() {
    localStorage.setItem("lostFoundItems", JSON.stringify(items));
}


// =========================================================
// DISPLAY REPORTS
// =========================================================

// Displays the reports that match the search and status filter.
function displayItems() {
    // Removes the previously displayed cards before showing updated results.
    itemsContainer.replaceChildren();

    // Converts the search text to lowercase for case-insensitive searching.
    const searchText = searchInput.value.trim().toLowerCase();

    // Gets the status selected by the user.
    const selectedStatus = filterStatus.value;

    // Filters the reports according to the search text and selected status.
    const filteredItems = items.filter(function(item) {
        // Supports older saved records that might not contain every field.
        const itemName = String(item.name || "");
        const itemLocation = String(item.location || "");

        // Checks whether the name or location contains the search text.
        const matchesSearch =
            itemName.toLowerCase().includes(searchText) ||
            itemLocation.toLowerCase().includes(searchText);

        // Shows all statuses when "all" is selected.
        const matchesStatus =
            selectedStatus === "all" ||
            item.status === selectedStatus;

        // A report must match both conditions to appear.
        return matchesSearch && matchesStatus;
    });

    // Displays a message when no reports match the current search.
    if (filteredItems.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.className = "no-items";

        if (items.length === 0) {
            emptyMessage.textContent =
                "No reports yet. Add a lost or found item above.";
        } else {
            emptyMessage.textContent =
                "No items found. Try another search or status filter.";
        }

        itemsContainer.appendChild(emptyMessage);
        return;
    }

    // Creates a card for each report that matches the filters.
    filteredItems.forEach(function(item) {
        const itemCard = document.createElement("article");

        itemCard.className = "item-card";

        // Creates the item name heading.
        const itemTitle = document.createElement("h3");
        itemTitle.textContent = item.name || "Unnamed Item";

        // Creates the status line.
        const statusParagraph = document.createElement("p");
        const statusLabel = document.createElement("strong");
        const statusValue = document.createElement("span");

        statusLabel.textContent = "Status: ";
        statusValue.className = "status";

        // Adds a different class to distinguish Lost and Found reports.
        if (item.status === "Lost") {
            statusValue.classList.add("status-lost");
        } else if (item.status === "Found") {
            statusValue.classList.add("status-found");
        }

        statusValue.textContent = item.status || "Unknown";

        statusParagraph.append(statusLabel, statusValue);

        // Creates the item description.
        const descriptionParagraph = document.createElement("p");
        const descriptionLabel = document.createElement("strong");

        descriptionLabel.textContent = "Description: ";

        descriptionParagraph.append(
            descriptionLabel,
            document.createTextNode(item.description || "No description provided.")
        );

        // Creates the location line.
        const locationParagraph = document.createElement("p");
        const locationLabel = document.createElement("strong");

        locationLabel.textContent = "Location: ";

        locationParagraph.append(
            locationLabel,
            document.createTextNode(item.location || "Not provided")
        );

        // Creates the reporter name line.
        const reporterParagraph = document.createElement("p");
        const reporterLabel = document.createElement("strong");

        reporterLabel.textContent = "Reported by: ";

        reporterParagraph.append(
            reporterLabel,
            document.createTextNode(item.reporter || "Not provided")
        );

        // Creates the contact number line.
        const contactParagraph = document.createElement("p");
        const contactLabel = document.createElement("strong");

        contactLabel.textContent = "Contact: ";

        contactParagraph.append(
            contactLabel,
            document.createTextNode(item.contact || "Not provided")
        );

        // Displays the report date.
        const dateParagraph = document.createElement("p");
        const dateLabel = document.createElement("strong");

        dateLabel.textContent = "Date Reported: ";

        // Older reports may not have a date, so display a fallback message.
        dateParagraph.append(
            dateLabel,
            document.createTextNode(item.reportDate || "Not recorded")
        );

        // Creates the delete button for this report.
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        // Adds an accessible label to identify the report being deleted.
        deleteButton.setAttribute(
            "aria-label",
            `Delete report for ${item.name || "unnamed item"}`
        );

        // Calls deleteItem with the report's unique ID.
        deleteButton.addEventListener("click", function() {
            deleteItem(item.id);
        });

        // Adds all report information and its button to the card.
        itemCard.append(
            itemTitle,
            statusParagraph,
            descriptionParagraph,
            locationParagraph,
            reporterParagraph,
            contactParagraph,
            dateParagraph,
            deleteButton
        );

        // Adds the completed card to the page.
        itemsContainer.appendChild(itemCard);
    });
}


// =========================================================
// ADD A NEW REPORT
// =========================================================

// Runs when the user submits the report form.
itemForm.addEventListener("submit", function(event) {
    // Prevents the browser from reloading the page.
    event.preventDefault();

    // Reads the values entered into the form.
    const itemName = document.getElementById("itemName").value.trim();
    const itemStatus = document.getElementById("itemStatus").value;
    const itemDescription =
        document.getElementById("itemDescription").value.trim();
    const itemLocation =
        document.getElementById("itemLocation").value.trim();
    const reporterName =
        document.getElementById("reporterName").value.trim();
    const contactNumber =
        document.getElementById("contactNumber").value.trim();
    const reportDate = reportDateInput.value;

    // Checks that required text fields are not empty or whitespace only.
    if (
        !itemName ||
        !itemDescription ||
        !itemLocation ||
        !reporterName ||
        !contactNumber
    ) {
        alert("Please complete all required fields.");
        return;
    }

    // Ensures that the contact number contains acceptable characters.
    const validContact = /^[0-9+() -]{7,20}$/.test(contactNumber);

    if (!validContact) {
        alert("Please enter a valid contact number.");
        document.getElementById("contactNumber").focus();
        return;
    }

    // Checks that the report date is valid and is not in the future.
    if (
        !reportDate ||
        Number.isNaN(new Date(`${reportDate}T12:00:00`).getTime()) ||
        reportDate > getTodayDate()
    ) {
        alert("Please select a valid report date that is not in the future.");
        reportDateInput.focus();
        return;
    }

    // Creates a new report object.
    const newItem = {
        // Uses the current timestamp as a simple unique report ID.
        id: Date.now(),

        name: itemName,
        status: itemStatus,
        description: itemDescription,
        location: itemLocation,
        reporter: reporterName,
        contact: contactNumber,
        reportDate: reportDate
    };

    // Adds the new report to the array.
    items.push(newItem);

    // Saves the updated array to localStorage.
    saveItems();

    // Clears the form after successful submission.
    itemForm.reset();

    // Restores today's date as the default for the next report.
    reportDateInput.value = getTodayDate();

    // Refreshes the report list using the current search and filter.
    displayItems();

    // Informs the user that the report was successfully added.
    alert("Item report added successfully!");
});


// =========================================================
// DELETE A REPORT
// =========================================================

// Deletes a report after the user confirms the action.
function deleteItem(id) {
    // Asks the user to confirm before permanently deleting the report.
    const confirmDelete = confirm(
        "Are you sure you want to delete this report?"
    );

    if (confirmDelete) {
        // Keeps all reports except the one with the selected ID.
        items = items.filter(function(item) {
            return item.id !== id;
        });

        // Saves the updated list.
        saveItems();

        // Refreshes the visible reports.
        displayItems();
    }
}


// =========================================================
// SEARCH AND FILTER EVENT LISTENERS
// =========================================================

// Refreshes the report list whenever the search text changes.
searchInput.addEventListener("input", displayItems);

// Refreshes the report list whenever the selected status changes.
filterStatus.addEventListener("change", displayItems);


// =========================================================
// INITIAL PAGE SETUP
// =========================================================

// Sets today's date as the default date for a new report.
reportDateInput.value = getTodayDate();

// Displays all saved reports when the page first opens.
displayItems();
