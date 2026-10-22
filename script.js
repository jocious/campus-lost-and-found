
/* =========================================================
   CAMPUS LOST AND FOUND
   Commit 3: Edit and Update Reports
   ========================================================= */

/* Keeps the same storage key used by earlier commits.
   Changing this key would make existing saved reports appear missing. */
const STORAGE_KEY = "lostFoundItems";

/* Gets the form and all form fields from the HTML. */
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

/* Gets the search and filter controls. */
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const filterDate = document.getElementById("filterDate");
const sortReports = document.getElementById("sortReports");
const resetFiltersButton = document.getElementById("resetFiltersButton");

/* Gets the elements used to display reports and the result count. */
const itemsContainer = document.getElementById("itemsContainer");
const resultCount = document.getElementById("resultCount");

/* Stores the ID of the report currently being edited.
   null means the form is currently in Add New Report mode. */
let editingId = null;

/* Loads existing reports from localStorage.
   The existing storage key and saved records are preserved. */
function loadItems() {
    try {
        const savedItems = localStorage.getItem(STORAGE_KEY);

        if (!savedItems) {
            return [];
        }

        const parsedItems = JSON.parse(savedItems);

        /* Prevents the program from treating invalid stored data as a list. */
        return Array.isArray(parsedItems) ? parsedItems : [];
    } catch (error) {
        console.error("Could not load saved reports:", error);
        alert("Saved reports could not be read. Your stored data has not been overwritten.");
        return [];
    }
}

/* Holds all reports currently loaded from storage. */
let items = loadItems();

/* Returns today's date in YYYY-MM-DD format for the date input. */
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/* Saves the current report list using the same storage key. */
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

/* Converts a YYYY-MM-DD date into a Date object.
   Returns null when the date is missing or invalid. */
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

    /* Confirms the date is a real calendar date. */
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

/* Finds the Monday of the current week for the date filter. */
function getStartOfThisWeek() {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay();
    const daysSinceMonday = (dayOfWeek + 6) % 7;

    today.setDate(today.getDate() - daysSinceMonday);

    return today;
}

/* Searches multiple fields instead of only the item name. */
function matchesSearch(item, searchText) {
    const searchableText = [
        item.name,
        item.location,
        item.description,
        item.reporter,
        item.contact,
        item.status
    ].filter(Boolean).join(" ").toLowerCase();

    return searchableText.includes(searchText);
}

/* Checks whether a report matches the selected date range. */
function matchesDateFilter(item, selectedDate) {
    if (selectedDate === "all") {
        return true;
    }

    const itemDate = parseReportDate(item.reportDate);

    /* Old reports without a date remain visible under All Dates. */
    if (!itemDate) {
        return false;
    }

    const today = parseReportDate(getTodayDate());

    if (selectedDate === "today") {
        return item.reportDate === getTodayDate();
    }

    if (selectedDate === "week") {
        const startOfWeek = getStartOfThisWeek();

        return itemDate >= startOfWeek && itemDate <= today;
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

/* Sorts matching reports according to the selected option. */
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

/* Applies search, status filtering, date filtering, and sorting. */
function getFilteredItems() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedStatus = filterStatus.value;
    const selectedDate = filterDate.value;

    const filteredItems = items.filter(function (item) {
        const matchesText = matchesSearch(item, searchText);

        const matchesStatus =
            selectedStatus === "All" || item.status === selectedStatus;

        const matchesDate = matchesDateFilter(item, selectedDate);

        return matchesText && matchesStatus && matchesDate;
    });

    return sortFilteredItems(filteredItems);
}

/* Creates a text element safely without interpreting report text as HTML. */
function addTextLine(parent, label, value) {
    const paragraph = document.createElement("p");
    const labelElement = document.createElement("strong");

    labelElement.textContent = label + ": ";
    paragraph.appendChild(labelElement);
    paragraph.appendChild(document.createTextNode(value || "Not provided"));

    parent.appendChild(paragraph);
}

/* Creates and displays one report card. */
function createReportCard(item) {
    const card = document.createElement("article");
    card.className = "item-card";

    const heading = document.createElement("h3");
    heading.textContent = item.name || "Unnamed Item";
    card.appendChild(heading);

    const statusLine = document.createElement("p");
    const statusLabel = document.createElement("strong");

    statusLabel.textContent = "Status: ";

    const statusValue = document.createElement("span");
    statusValue.textContent = item.status || "Not recorded";
    statusValue.className =
        item.status === "Lost" ? "status-lost" :
        item.status === "Found" ? "status-found" : "";

    statusLine.appendChild(statusLabel);
    statusLine.appendChild(statusValue);
    card.appendChild(statusLine);

    addTextLine(card, "Description", item.description);
    addTextLine(card, "Location", item.location);
    addTextLine(card, "Reporter", item.reporter);
    addTextLine(card, "Contact", item.contact);
    addTextLine(card, "Report Date", item.reportDate || "Not recorded");

    /* Places Edit and Delete buttons in one container. */
    const actionContainer = document.createElement("div");
    actionContainer.className = "item-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-button";
    editButton.textContent = "Edit";

    /* Passes the ID of this specific report to the edit function. */
    editButton.addEventListener("click", function () {
        startEditing(item.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", function () {
        deleteItem(item.id);
    });

    actionContainer.appendChild(editButton);
    actionContainer.appendChild(deleteButton);
    card.appendChild(actionContainer);

    return card;
}

/* Displays reports that match the current search and filters. */
function displayItems() {
    const filteredItems = getFilteredItems();

    /* Clears the old display before creating the updated list. */
    itemsContainer.replaceChildren();

    resultCount.textContent =
        filteredItems.length +
        (filteredItems.length === 1 ? " report found" : " reports found");

    if (filteredItems.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-message";
        emptyMessage.textContent = "No reports match your search or filters.";
        itemsContainer.appendChild(emptyMessage);
        return;
    }

    filteredItems.forEach(function (item) {
        itemsContainer.appendChild(createReportCard(item));
    });
}

/* Resets the form and returns it to Add New Report mode. */
function resetForm() {
    editingId = null;

    itemForm.reset();

    /* Gives new reports today's date by default. */
    reportDate.value = getTodayDate();

    formTitle.textContent = "Submit a Report";
    submitButton.textContent = "Submit Report";
    cancelEditButton.hidden = true;
}

/* Fills the form with the selected report's existing information. */
function startEditing(id) {
    /* Finds the exact report by its unique ID. */
    const itemToEdit = items.find(function (item) {
        return item.id === id;
    });

    if (!itemToEdit) {
        alert("This report could not be found. Please refresh the page and try again.");
        return;
    }

    /* Records which report is being edited.
       This ID lets the submit handler update the right record instead of adding a new one. */
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

    /* Brings the form into view so the user can edit the report. */
    itemForm.scrollIntoView({ behavior: "smooth", block: "start" });
    itemName.focus();
}

/* Adds a new report or updates an existing report, depending on the form mode. */
itemForm.addEventListener("submit", function (event) {
    /* Stops the browser from refreshing the page when the form is submitted. */
    event.preventDefault();

    /* Trims unnecessary spaces from the text fields. */
    const name = itemName.value.trim();
    const status = itemStatus.value;
    const description = itemDescription.value.trim();
    const location = itemLocation.value.trim();
    const reporter = reporterName.value.trim();
    const contact = contactNumber.value.trim();
    const date = reportDate.value;

    /* Checks required text fields before saving. */
    if (!name || !description || !location || !reporter || !contact || !date) {
        alert("Please complete all fields before saving.");
        return;
    }

    /* Accepts common phone number characters and requires enough digits/characters. */
    const contactPattern = /^[0-9+() -]{7,20}$/;

    if (!contactPattern.test(contact)) {
        alert("Please enter a valid contact number.");
        return;
    }

    /* Prevents a report date later than today. */
    if (date > getTodayDate()) {
        alert("The report date cannot be in the future.");
        return;
    }

    /* The report's data is collected in one object. */
    const reportData = {
        name: name,
        status: status,
        description: description,
        location: location,
        reporter: reporter,
        contact: contact,
        reportDate: date
    };

    /* EDIT MODE:
       Find and update the existing report.
       Its ID is preserved, and no new report is pushed into the array. */
    if (editingId !== null) {
        const itemIndex = items.findIndex(function (item) {
            return item.id === editingId;
        });

        if (itemIndex === -1) {
            alert("The report being edited no longer exists. Your changes were not saved.");
            resetForm();
            return;
        }

        const previousItem = items[itemIndex];

        /* Keeps the original ID and replaces only the report's editable information. */
        const updatedItem = {
            ...previousItem,
            ...reportData,
            id: previousItem.id
        };

        const oldItem = items[itemIndex];
        items[itemIndex] = updatedItem;

        /* Only leave the update in memory if it was successfully saved. */
        if (!saveItems()) {
            items[itemIndex] = oldItem;
            return;
        }

        alert("Report updated successfully.");
    } else {
        /* ADD MODE:
           Create a new report with a unique ID.
           This code runs only when the form is not editing an existing report. */
        const newItem = {
            id: Date.now(),
            ...reportData
        };

        items.push(newItem);

        /* Undo the in-memory addition if storage fails. */
        if (!saveItems()) {
            items.pop();
            return;
        }

        alert("Report submitted successfully.");
    }

    /* Returns the form to its normal state after a successful save. */
    resetForm();

    /* Refreshes the report list so updated information appears immediately. */
    displayItems();
});

/* Cancels editing without changing the saved report. */
cancelEditButton.addEventListener("click", function () {
    resetForm();
});

/* Deletes a report after asking for confirmation. */
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

    const originalItems = items;

    /* Creates a new array without the selected report. */
    items = items.filter(function (item) {
        return item.id !== id;
    });

    if (!saveItems()) {
        /* Restores the previous list if saving the deletion fails. */
        items = originalItems;
        return;
    }

    /* If the deleted report was being edited, leave edit mode. */
    if (editingId === id) {
        resetForm();
    }

    displayItems();
}

/* Clears all search and filter settings. */
function resetFilters() {
    searchInput.value = "";
    filterStatus.value = "All";
    filterDate.value = "all";
    sortReports.value = "newest";

    displayItems();
}

/* Refreshes the displayed reports whenever a filter changes. */
searchInput.addEventListener("input", displayItems);
filterStatus.addEventListener("change", displayItems);
filterDate.addEventListener("change", displayItems);
sortReports.addEventListener("change", displayItems);
resetFiltersButton.addEventListener("click", resetFilters);

/* Initializes the form and report list when the page loads. */
reportDate.value = getTodayDate();
displayItems();
