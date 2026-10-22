
/* =========================================================
   CAMPUS LOST AND FOUND
   Commit 4: Returned Item Tracking
   ========================================================= */

/* Keep the same storage key so earlier reports remain accessible. */
const STORAGE_KEY = "lostFoundItems";

/* Form elements. */
const itemForm = document.getElementById("itemForm");
const formTitle = document.getElementById("formTitle");
const itemName = document.getElementById("itemName");
const itemStatus = document.getElementById("itemStatus");
const itemDescription = document.getElementById("itemDescription");
const itemLocation = document.getElementById("itemLocation");
const reporterName = document.getElementById("reporterName");
const contactNumber = document.getElementById("contactNumber");
const reportDate = document.getElementById("reportDate");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");

/* Search, filter, and sorting elements. */
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const filterDate = document.getElementById("filterDate");
const sortReports = document.getElementById("sortReports");
const resetFiltersButton = document.getElementById("resetFiltersButton");

/* Report display and summary elements. */
const itemsContainer = document.getElementById("itemsContainer");
const resultCount = document.getElementById("resultCount");
const lostCount = document.getElementById("lostCount");
const foundCount = document.getElementById("foundCount");
const returnedCount = document.getElementById("returnedCount");

/* null means the form is not currently editing a report. */
let editingId = null;

/* Loads the existing reports from localStorage. */
function loadItems() {
    try {
        const savedItems = localStorage.getItem(STORAGE_KEY);

        if (!savedItems) {
            return [];
        }

        const parsedItems = JSON.parse(savedItems);

        return Array.isArray(parsedItems) ? parsedItems : [];
    } catch (error) {
        console.error("Could not load saved reports:", error);
        alert("Saved reports could not be read. Your stored data has not been overwritten.");
        return [];
    }
}

/* Stores all loaded reports in this array. */
let items = loadItems();

/* Returns today's local date as YYYY-MM-DD. */
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/* Saves reports without changing the existing storage key. */
function saveItems() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        return true;
    } catch (error) {
        console.error("Could not save reports:", error);
        alert("The reports could not be saved. Check your browser storage.");
        return false;
    }
}

/* Converts a valid YYYY-MM-DD string into a Date object. */
function parseReportDate(dateString) {
    if (!dateString || typeof dateString !== "string") {
        return null;
    }

    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return null;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    const date = new Date(year, month - 1, day);

    /* Rejects impossible calendar dates such as February 30. */
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

/* Finds the Monday at the start of this week. */
function getStartOfThisWeek() {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const daysSinceMonday = (today.getDay() + 6) % 7;
    today.setDate(today.getDate() - daysSinceMonday);

    return today;
}

/* Searches the item's name, status, location, description, reporter, and contact. */
function matchesSearch(item, searchText) {
    const searchableText = [
        item.name,
        item.status,
        item.location,
        item.description,
        item.reporter,
        item.contact
    ].filter(Boolean).join(" ").toLowerCase();

    return searchableText.includes(searchText);
}

/* Checks whether a report belongs to the selected date range. */
function matchesDateFilter(item, selectedDate) {
    if (selectedDate === "all") {
        return true;
    }

    const itemDate = parseReportDate(item.reportDate);

    /* Old records without a date are still available under All Dates. */
    if (!itemDate) {
        return false;
    }

    const today = parseReportDate(getTodayDate());

    if (selectedDate === "today") {
        return item.reportDate === getTodayDate();
    }

    if (selectedDate === "week") {
        return itemDate >= getStartOfThisWeek() && itemDate <= today;
    }

    if (selectedDate === "month") {
        return (
            itemDate.getFullYear() === today.getFullYear() &&
            itemDate.getMonth() === today.getMonth() &&
            itemDate <= today
        );
    }

    return true;
}

/* Sorts the filtered reports by date or item name. */
function sortFilteredItems(filteredItems) {
    const selectedSort = sortReports.value;

    return filteredItems.sort(function (firstItem, secondItem) {
        if (selectedSort === "name") {
            return String(firstItem.name || "").localeCompare(
                String(secondItem.name || "")
            );
        }

        const firstDate = parseReportDate(firstItem.reportDate);
        const secondDate = parseReportDate(secondItem.reportDate);

        const firstTime = firstDate ? firstDate.getTime() : 0;
        const secondTime = secondDate ? secondDate.getTime() : 0;

        if (selectedSort === "oldest") {
            return firstTime - secondTime;
        }

        return secondTime - firstTime;
    });
}

/* Applies all search and filter settings together. */
function getFilteredItems() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedStatus = filterStatus.value;
    const selectedDate = filterDate.value;

    const filteredItems = items.filter(function (item) {
        const matchesText = matchesSearch(item, searchText);

        /* Treat older records without a status as Lost for compatibility. */
        const currentStatus = item.status || "Lost";

        const matchesStatus =
            selectedStatus === "All" || currentStatus === selectedStatus;

        const matchesDate = matchesDateFilter(item, selectedDate);

        return matchesText && matchesStatus && matchesDate;
    });

    return sortFilteredItems(filteredItems);
}

/* Displays the totals for each report status.
   These totals use every saved report, not only filtered results. */
function updateSummary() {
    let lost = 0;
    let found = 0;
    let returned = 0;

    items.forEach(function (item) {
        /* Older reports without a status are counted as Lost. */
        const status = item.status || "Lost";

        if (status === "Lost") {
            lost++;
        } else if (status === "Found") {
            found++;
        } else if (status === "Returned") {
            returned++;
        }
    });

    lostCount.textContent = lost;
    foundCount.textContent = found;
    returnedCount.textContent = returned;
}

/* Adds a label and its value safely to a report card. */
function addTextLine(parent, label, value) {
    const paragraph = document.createElement("p");
    const labelElement = document.createElement("strong");

    labelElement.textContent = label + ": ";
    paragraph.appendChild(labelElement);
    paragraph.appendChild(
        document.createTextNode(value || "Not provided")
    );

    parent.appendChild(paragraph);
}

/* Creates a report card and its available action buttons. */
function createReportCard(item) {
    const card = document.createElement("article");
    card.className = "item-card";

    const heading = document.createElement("h3");
    heading.textContent = item.name || "Unnamed Item";
    card.appendChild(heading);

    const status = item.status || "Lost";

    const statusLine = document.createElement("p");
    const statusLabel = document.createElement("strong");
    const statusValue = document.createElement("span");

    statusLabel.textContent = "Status: ";
    statusValue.textContent = status;

    if (status === "Lost") {
        statusValue.className = "status-lost";
    } else if (status === "Found") {
        statusValue.className = "status-found";
    } else if (status === "Returned") {
        statusValue.className = "status-returned";
    }

    statusLine.appendChild(statusLabel);
    statusLine.appendChild(statusValue);
    card.appendChild(statusLine);

    addTextLine(card, "Description", item.description);
    addTextLine(card, "Location", item.location);
    addTextLine(card, "Reporter", item.reporter);
    addTextLine(card, "Contact", item.contact);
    addTextLine(card, "Report Date", item.reportDate || "Not recorded");

    const actionContainer = document.createElement("div");
    actionContainer.className = "item-actions";

    /* Edit button: fills the form with this report's details. */
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-button";
    editButton.textContent = "Edit";

    editButton.addEventListener("click", function () {
        startEditing(item.id);
    });

    actionContainer.appendChild(editButton);

    /* Only reports not yet returned can be marked as Returned. */
    if (status !== "Returned") {
        const returnButton = document.createElement("button");
        returnButton.type = "button";
        returnButton.className = "return-button";
        returnButton.textContent = "Mark as Returned";

        returnButton.addEventListener("click", function () {
            markAsReturned(item.id);
        });

        actionContainer.appendChild(returnButton);
    }

    /* Delete button: removes the selected report after confirmation. */
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", function () {
        deleteItem(item.id);
    });

    actionContainer.appendChild(deleteButton);
    card.appendChild(actionContainer);

    return card;
}

/* Updates the report list and the number of matching results. */
function displayItems() {
    const filteredItems = getFilteredItems();

    itemsContainer.replaceChildren();

    resultCount.textContent =
        filteredItems.length +
        (filteredItems.length === 1 ? " report found" : " reports found");

    if (filteredItems.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-message";
        emptyMessage.textContent = "No reports match your search or filters.";
        itemsContainer.appendChild(emptyMessage);
    } else {
        filteredItems.forEach(function (item) {
            itemsContainer.appendChild(createReportCard(item));
        });
    }

    /* Summary counts always reflect the full saved report list. */
    updateSummary();
}

/* Switches the form back to Add New Report mode. */
function resetForm() {
    editingId = null;

    itemForm.reset();

    reportDate.value = getTodayDate();
    formTitle.textContent = "Submit a Report";
    submitButton.textContent = "Submit Report";
    cancelEditButton.hidden = true;
}

/* Loads an existing report into the form for editing. */
function startEditing(id) {
    const itemToEdit = items.find(function (item) {
        return item.id === id;
    });

    if (!itemToEdit) {
        alert("This report could not be found. Please refresh the page and try again.");
        return;
    }

    editingId = id;

    itemName.value = itemToEdit.name || "";
    itemStatus.value = itemToEdit.status || "Lost";
    itemDescription.value = itemToEdit.description || "";
    itemLocation.value = itemToEdit.location || "";
    reporterName.value = itemToEdit.reporter || "";
    contactNumber.value = itemToEdit.contact || "";
    reportDate.value = itemToEdit.reportDate || getTodayDate();

    formTitle.textContent = "Edit Report";
    submitButton.textContent = "Save Changes";
    cancelEditButton.hidden = false;

    itemForm.scrollIntoView({ behavior: "smooth", block: "start" });
    itemName.focus();
}

/* Adds a new report or updates an existing report. */
itemForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = itemName.value.trim();
    const status = itemStatus.value;
    const description = itemDescription.value.trim();
    const location = itemLocation.value.trim();
    const reporter = reporterName.value.trim();
    const contact = contactNumber.value.trim();
    const date = reportDate.value;

    if (!name || !description || !location || !reporter || !contact || !date) {
        alert("Please complete all fields before saving.");
        return;
    }

    const contactPattern = /^[0-9+() -]{7,20}$/;

    if (!contactPattern.test(contact)) {
        alert("Please enter a valid contact number.");
        return;
    }

    if (date > getTodayDate()) {
        alert("The report date cannot be in the future.");
        return;
    }

    const reportData = {
        name: name,
        status: status,
        description: description,
        location: location,
        reporter: reporter,
        contact: contact,
        reportDate: date
    };

    if (editingId !== null) {
        /* EDIT MODE: update the matching report without adding a duplicate. */
        const itemIndex = items.findIndex(function (item) {
            return item.id === editingId;
        });

        if (itemIndex === -1) {
            alert("The report being edited no longer exists. Your changes were not saved.");
            resetForm();
            return;
        }

        const previousItem = items[itemIndex];

        const updatedItem = {
            ...previousItem,
            ...reportData,
            id: previousItem.id
        };

        items[itemIndex] = updatedItem;

        if (!saveItems()) {
            items[itemIndex] = previousItem;
            return;
        }

        alert("Report updated successfully.");
    } else {
        /* ADD MODE: create a new report with its own ID. */
        const newItem = {
            id: Date.now(),
            ...reportData
        };

        items.push(newItem);

        if (!saveItems()) {
            items.pop();
            return;
        }

        alert("Report submitted successfully.");
    }

    resetForm();
    displayItems();
});

/* Marks a report as Returned without creating another report. */
function markAsReturned(id) {
    const itemIndex = items.findIndex(function (item) {
        return item.id === id;
    });

    if (itemIndex === -1) {
        alert("This report could not be found.");
        return;
    }

    const currentItem = items[itemIndex];

    if (currentItem.status === "Returned") {
        return;
    }

    const confirmed = confirm(
        'Mark "' + (currentItem.name || "this item") +
        '" as Returned?'
    );

    if (!confirmed) {
        return;
    }

    /* Keep the original record and ID; only change its status. */
    const previousItem = currentItem;

    items[itemIndex] = {
        ...currentItem,
        status: "Returned"
    };

    if (!saveItems()) {
        /* Restore the previous report if saving fails. */
        items[itemIndex] = previousItem;
        return;
    }

    /* If this report is currently being edited, update the form too. */
    if (editingId === id) {
        itemStatus.value = "Returned";
    }

    displayItems();
}

/* Cancels editing without saving unsaved form changes. */
cancelEditButton.addEventListener("click", function () {
    resetForm();
});

/* Deletes a report after confirmation. */
function deleteItem(id) {
    const itemToDelete = items.find(function (item) {
        return item.id === id;
    });

    if (!itemToDelete) {
        return;
    }

    const confirmed = confirm(
        'Are you sure you want to delete "' +
        (itemToDelete.name || "this report") +
        '"?'
    );

    if (!confirmed) {
        return;
    }

    const previousItems = items;

    items = items.filter(function (item) {
        return item.id !== id;
    });

    if (!saveItems()) {
        items = previousItems;
        return;
    }

    if (editingId === id) {
        resetForm();
    }

    displayItems();
}

/* Restores the search and filter controls to their default values. */
function resetFilters() {
    searchInput.value = "";
    filterStatus.value = "All";
    filterDate.value = "all";
    sortReports.value = "newest";

    displayItems();
}

/* Updates the report list whenever search or filters change. */
searchInput.addEventListener("input", displayItems);
filterStatus.addEventListener("change", displayItems);
filterDate.addEventListener("change", displayItems);
sortReports.addEventListener("change", displayItems);
resetFiltersButton.addEventListener("click", resetFilters);

/* Sets the default date and displays saved reports when the page loads. */
reportDate.value = getTodayDate();
displayItems();
