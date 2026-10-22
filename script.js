
/* =========================================================
   CAMPUS LOST AND FOUND
   Commit 5: Dashboard and Responsive Design
   ========================================================= */

/* IMPORTANT:
   Keep this storage key unchanged so reports from earlier commits
   can still be loaded from the browser's localStorage. */
const STORAGE_KEY = "lostFoundItems";

/* =========================================================
   FORM ELEMENTS
   ========================================================= */

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

/* =========================================================
   SEARCH AND FILTER ELEMENTS
   ========================================================= */

const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const filterDate = document.getElementById("filterDate");
const sortReports = document.getElementById("sortReports");
const resetFiltersButton = document.getElementById("resetFiltersButton");

/* =========================================================
   REPORT LIST AND DASHBOARD ELEMENTS
   ========================================================= */

const itemsContainer = document.getElementById("itemsContainer");
const resultCount = document.getElementById("resultCount");

const totalCount = document.getElementById("totalCount");
const lostCount = document.getElementById("lostCount");
const foundCount = document.getElementById("foundCount");
const returnedCount = document.getElementById("returnedCount");

const overviewTotal = document.getElementById("overviewTotal");

const lostPercentage = document.getElementById("lostPercentage");
const foundPercentage = document.getElementById("foundPercentage");
const returnedPercentage = document.getElementById("returnedPercentage");

const lostProgress = document.getElementById("lostProgress");
const foundProgress = document.getElementById("foundProgress");
const returnedProgress = document.getElementById("returnedProgress");

const lostProgressFill = document.getElementById("lostProgressFill");
const foundProgressFill = document.getElementById("foundProgressFill");
const returnedProgressFill = document.getElementById("returnedProgressFill");

/* null means the form is adding a new report.
   Otherwise, it contains the ID of the report being edited. */
let editingId = null;

/* =========================================================
   LOAD AND SAVE REPORTS
   ========================================================= */

/* Loads saved reports from localStorage.
   Older reports without a status are treated as Lost when displayed. */
function loadItems() {
    try {
        const savedItems = localStorage.getItem(STORAGE_KEY);

        if (!savedItems) {
            return [];
        }

        const parsedItems = JSON.parse(savedItems);

        if (!Array.isArray(parsedItems)) {
            alert("The saved report data is not in the expected format.");
            return [];
        }

        return parsedItems;
    } catch (error) {
        console.error("Could not load saved reports:", error);
        alert("Saved reports could not be read. Your stored data has not been overwritten.");
        return [];
    }
}

/* Holds the reports currently loaded into the application. */
let items = loadItems();

/* Saves all reports using the same storage key. */
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

/* =========================================================
   DATE HELPERS
   ========================================================= */

/* Returns today's date in YYYY-MM-DD format.
   This format is used by HTML date inputs. */
function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
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

    /* Checks that the supplied values form a real calendar date. */
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

/* Returns Monday at the beginning of the current week. */
function getStartOfThisWeek() {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    /* JavaScript uses Sunday = 0, so this calculates days since Monday. */
    const daysSinceMonday = (today.getDay() + 6) % 7;

    today.setDate(today.getDate() - daysSinceMonday);

    return today;
}

/* =========================================================
   SEARCH, FILTERING, AND SORTING
   ========================================================= */

/* Searches all the useful text fields of a report. */
function matchesSearch(item, searchText) {
    const searchableText = [
        item.name,
        item.status || "Lost",
        item.location,
        item.description,
        item.reporter,
        item.contact
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return searchableText.includes(searchText);
}

/* Checks whether a report matches the selected date range. */
function matchesDateFilter(item, selectedDate) {
    if (selectedDate === "all") {
        return true;
    }

    const itemDate = parseReportDate(item.reportDate);

    /* Older reports without dates remain visible under All Dates. */
    if (!itemDate) {
        return false;
    }

    const todayString = getTodayDate();
    const today = parseReportDate(todayString);

    if (selectedDate === "today") {
        return item.reportDate === todayString;
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

/* Combines search, status filtering, date filtering, and sorting. */
function getFilteredItems() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedStatus = filterStatus.value;
    const selectedDate = filterDate.value;

    const filteredItems = items.filter(function (item) {
        const currentStatus = item.status || "Lost";

        const matchesText = matchesSearch(item, searchText);

        const matchesStatus =
            selectedStatus === "All" || currentStatus === selectedStatus;

        const matchesDate = matchesDateFilter(item, selectedDate);

        return matchesText && matchesStatus && matchesDate;
    });

    return sortFilteredItems(filteredItems);
}

/* =========================================================
   DASHBOARD SUMMARY AND PROGRESS BARS
   ========================================================= */

/* Calculates the number and percentage of reports in each status.
   The dashboard uses ALL saved reports, not just filtered results. */
function updateDashboard() {
    let lost = 0;
    let found = 0;
    let returned = 0;

    items.forEach(function (item) {
        /* Treat old records without a status as Lost. */
        const status = item.status || "Lost";

        if (status === "Lost") {
            lost++;
        } else if (status === "Found") {
            found++;
        } else if (status === "Returned") {
            returned++;
        }
    });

    const total = items.length;

    /* Updates the four dashboard summary numbers. */
    totalCount.textContent = total;
    lostCount.textContent = lost;
    foundCount.textContent = found;
    returnedCount.textContent = returned;

    overviewTotal.textContent =
        total + (total === 1 ? " report" : " reports");

    /* Avoids division by zero when there are no reports. */
    const lostPercent = total === 0 ? 0 : Math.round((lost / total) * 100);
    const foundPercent = total === 0 ? 0 : Math.round((found / total) * 100);
    const returnedPercent =
        total === 0 ? 0 : Math.round((returned / total) * 100);

    /* Displays percentages next to each progress bar. */
    lostPercentage.textContent = lostPercent + "%";
    foundPercentage.textContent = foundPercent + "%";
    returnedPercentage.textContent = returnedPercent + "%";

    /* Changes the width of each colored progress bar. */
    lostProgressFill.style.width = lostPercent + "%";
    foundProgressFill.style.width = foundPercent + "%";
    returnedProgressFill.style.width = returnedPercent + "%";

    /* Keeps progress bar accessibility values up to date. */
    lostProgress.setAttribute("aria-valuenow", lostPercent);
    foundProgress.setAttribute("aria-valuenow", foundPercent);
    returnedProgress.setAttribute("aria-valuenow", returnedPercent);
}

/* =========================================================
   CREATE REPORT CARDS
   ========================================================= */

/* Adds a text line safely to a report card.
   textContent and createTextNode prevent report text from being treated as HTML. */
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

/* Creates one report card with Edit, Return, and Delete actions. */
function createReportCard(item) {
    const card = document.createElement("article");
    card.className = "item-card";

    /* Displays the item name. */
    const heading = document.createElement("h3");
    heading.textContent = item.name || "Unnamed Item";
    card.appendChild(heading);

    /* Older records without a status are treated as Lost. */
    const currentStatus = item.status || "Lost";

    /* Displays the status with its matching CSS class. */
    const statusLine = document.createElement("p");
    const statusLabel = document.createElement("strong");
    const statusValue = document.createElement("span");

    statusLabel.textContent = "Status: ";
    statusValue.textContent = currentStatus;

    if (currentStatus === "Lost") {
        statusValue.className = "status-lost";
    } else if (currentStatus === "Found") {
        statusValue.className = "status-found";
    } else if (currentStatus === "Returned") {
        statusValue.className = "status-returned";
    }

    statusLine.appendChild(statusLabel);
    statusLine.appendChild(statusValue);
    card.appendChild(statusLine);

    /* Displays the remaining report details. */
    addTextLine(card, "Description", item.description);
    addTextLine(card, "Location", item.location);
    addTextLine(card, "Reporter", item.reporter);
    addTextLine(card, "Contact", item.contact);
    addTextLine(card, "Report Date", item.reportDate || "Not recorded");

    /* Creates the container for action buttons. */
    const actionContainer = document.createElement("div");
    actionContainer.className = "item-actions";

    /* EDIT BUTTON:
       Opens the selected report in the form. */
    const editButton = document.createElement("button");

    editButton.type = "button";
    editButton.className = "edit-button";
    editButton.textContent = "Edit";

    editButton.addEventListener("click", function () {
        startEditing(item.id);
    });

    actionContainer.appendChild(editButton);

    /* RETURN BUTTON:
       Only displays when the item has not already been returned. */
    if (currentStatus !== "Returned") {
        const returnButton = document.createElement("button");

        returnButton.type = "button";
        returnButton.className = "return-button";
        returnButton.textContent = "Mark as Returned";

        returnButton.addEventListener("click", function () {
            markAsReturned(item.id);
        });

        actionContainer.appendChild(returnButton);
    }

    /* DELETE BUTTON:
       Removes the selected report after confirmation. */
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

/* =========================================================
   DISPLAY REPORTS
   ========================================================= */

/* Rebuilds the report list and refreshes the dashboard. */
function displayItems() {
    const filteredItems = getFilteredItems();

    /* Removes the previously displayed cards. */
    itemsContainer.replaceChildren();

    /* Shows how many reports match the active filters. */
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

    /* The dashboard always reflects all saved reports. */
    updateDashboard();
}

/* =========================================================
   ADD AND EDIT REPORTS
   ========================================================= */

/* Resets the form and exits edit mode. */
function resetForm() {
    editingId = null;

    itemForm.reset();

    reportDate.value = getTodayDate();

    formTitle.textContent = "Submit a Report";
    submitButton.textContent = "Submit Report";
    cancelEditButton.hidden = true;
}

/* Loads a selected report into the form. */
function startEditing(id) {
    const itemToEdit = items.find(function (item) {
        return item.id === id;
    });

    if (!itemToEdit) {
        alert("This report could not be found. Please refresh the page and try again.");
        return;
    }

    /* Stores the ID so the submit handler knows which record to update. */
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

    /* Brings the form into view. */
    document.getElementById("reportFormSection").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    itemName.focus();
}

/* Handles both new reports and updates to existing reports. */
itemForm.addEventListener("submit", function (event) {
    event.preventDefault();

    /* Trims unnecessary spaces from text inputs. */
    const name = itemName.value.trim();
    const status = itemStatus.value;
    const description = itemDescription.value.trim();
    const location = itemLocation.value.trim();
    const reporter = reporterName.value.trim();
    const contact = contactNumber.value.trim();
    const date = reportDate.value;

    /* Checks that every required field has a value. */
    if (!name || !description || !location || !reporter || !contact || !date) {
        alert("Please complete all fields before saving.");
        return;
    }

    /* Allows common phone number characters. */
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

    /* Collects the fields that the user can edit. */
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
        /* EDIT MODE:
           Updates the existing report rather than adding a duplicate. */
        const itemIndex = items.findIndex(function (item) {
            return item.id === editingId;
        });

        if (itemIndex === -1) {
            alert("The report being edited no longer exists. Your changes were not saved.");
            resetForm();
            return;
        }

        const previousItem = items[itemIndex];

        /* Preserves the original ID and any other existing properties. */
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
        /* ADD MODE:
           Creates a new report with a unique ID. */
        let newId = Date.now();

        /* Avoids an ID collision if two reports are created very quickly. */
        while (items.some(function (item) {
            return item.id === newId;
        })) {
            newId++;
        }

        const newItem = {
            id: newId,
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

/* Cancels edit mode without saving unsaved form changes. */
cancelEditButton.addEventListener("click", function () {
    resetForm();
});

/* =========================================================
   RETURNED ITEM TRACKING
   ========================================================= */

/* Changes a report's status to Returned without creating a new record. */
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

    const previousItem = currentItem;

    /* Preserves the existing report and changes only its status. */
    items[itemIndex] = {
        ...currentItem,
        status: "Returned"
    };

    if (!saveItems()) {
        items[itemIndex] = previousItem;
        return;
    }

    /* If the same report is being edited, reflect the status in the form. */
    if (editingId === id) {
        itemStatus.value = "Returned";
    }

    displayItems();
}

/* =========================================================
   DELETE REPORTS
   ========================================================= */

/* Deletes the selected report only after user confirmation. */
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

    /* Prevents the form from editing a report that no longer exists. */
    if (editingId === id) {
        resetForm();
    }

    displayItems();
}

/* =========================================================
   RESET SEARCH AND FILTERS
   ========================================================= */

/* Restores the default search, filter, and sort settings. */
function resetFilters() {
    searchInput.value = "";
    filterStatus.value = "All";
    filterDate.value = "all";
    sortReports.value = "newest";

    displayItems();
}

/* =========================================================
   EVENT LISTENERS AND INITIAL DISPLAY
   ========================================================= */

/* Refreshes the list whenever search or filter settings change. */
searchInput.addEventListener("input", displayItems);
filterStatus.addEventListener("change", displayItems);
filterDate.addEventListener("change", displayItems);
sortReports.addEventListener("change", displayItems);
resetFiltersButton.addEventListener("click", resetFilters);

/* Sets today's date in the form and shows the saved reports. */
reportDate.value = getTodayDate();
displayItems();
