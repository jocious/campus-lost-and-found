
// =========================================================
// CAMPUS LOST & FOUND
// COMMIT 2: ADVANCED SEARCH AND FILTERS
// =========================================================

// Load existing reports from localStorage.
// Keep this key unchanged to preserve previously saved reports.
let items = JSON.parse(localStorage.getItem("lostFoundItems")) || [];


// Get the HTML elements used by the application.
const itemForm = document.getElementById("itemForm");
const itemsContainer = document.getElementById("itemsContainer");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const filterDate = document.getElementById("filterDate");
const sortReports = document.getElementById("sortReports");
const resetFiltersButton = document.getElementById("resetFiltersButton");
const resultCount = document.getElementById("resultCount");
const reportDateInput = document.getElementById("reportDate");


// =========================================================
// DATE HELPERS
// =========================================================

// Returns today's date in YYYY-MM-DD format using local time.
function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Converts a date string into a Date object at local midday.
// Midday helps avoid date-boundary issues caused by time zones.
function parseReportDate(dateString) {
    if (!dateString) {
        return null;
    }

    const date = new Date(`${dateString}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

// Returns the beginning of the current week.
// In this project, the week begins on Monday.
function getStartOfThisWeek() {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay();

    // Sunday is 0, Monday is 1, and so on.
    // This calculation moves the date back to Monday.
    const daysSinceMonday = (dayOfWeek + 6) % 7;

    today.setDate(today.getDate() - daysSinceMonday);

    return today;
}


// =========================================================
// SAVE REPORTS
// =========================================================

// Saves the full report array to localStorage.
function saveItems() {
    localStorage.setItem("lostFoundItems", JSON.stringify(items));
}


// =========================================================
// SEARCH MATCHING
// =========================================================

// Checks whether a report matches the user's search text.
// Searches across the name, location, description, reporter, and contact.
function matchesSearch(item, searchText) {
    const searchableFields = [
        item.name,
        item.location,
        item.description,
        item.reporter,
        item.contact
    ];

    return searchableFields.some(function(value) {
        return String(value || "")
            .toLowerCase()
            .includes(searchText);
    });
}


// =========================================================
// DATE FILTERING
// =========================================================

// Checks whether a report belongs to the selected date range.
function matchesDateFilter(item, selectedDate) {
    // All Dates includes older reports that have no recorded date.
    if (selectedDate === "all") {
        return true;
    }

    const reportDate = parseReportDate(item.reportDate);

    // A report without a valid date cannot match a specific date range.
    if (!reportDate) {
        return false;
    }

    const todayString = getTodayDate();

    // Compare date strings for the Today filter.
    if (selectedDate === "today") {
        return item.reportDate === todayString;
    }

    if (selectedDate === "week") {
        const startOfWeek = getStartOfThisWeek();
        const startOfNextWeek = new Date(startOfWeek);

        startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

        // Include this Monday through Sunday.
        return (
            reportDate >= startOfWeek &&
            reportDate < startOfNextWeek
        );
    }

    if (selectedDate === "month") {
        const today = new Date();

        return (
            reportDate.getFullYear() === today.getFullYear() &&
            reportDate.getMonth() === today.getMonth()
        );
    }

    return true;
}


// =========================================================
// SORTING
// =========================================================

// Returns a sorted copy of the matching reports.
// The original items array is not rearranged.
function sortFilteredItems(filteredItems) {
    const sortChoice = sortReports.value;

    return filteredItems.sort(function(firstItem, secondItem) {
        if (sortChoice === "name") {
            // Sort names alphabetically without case sensitivity.
            return String(firstItem.name || "").localeCompare(
                String(secondItem.name || ""),
                undefined,
                { sensitivity: "base" }
            );
        }

        const firstDate = String(firstItem.reportDate || "");
        const secondDate = String(secondItem.reportDate || "");

        if (sortChoice === "oldest") {
            // Oldest dated reports appear first.
            const dateComparison = firstDate.localeCompare(secondDate);

            if (dateComparison !== 0) {
                return dateComparison;
            }

            // Use the ID as a fallback when dates are equal or missing.
            return Number(firstItem.id) - Number(secondItem.id);
        }

        // Newest First is the default sorting option.
        const dateComparison = secondDate.localeCompare(firstDate);

        if (dateComparison !== 0) {
            return dateComparison;
        }

        // Use the ID as a fallback when dates are equal or missing.
        return Number(secondItem.id) - Number(firstItem.id);
    });
}


// =========================================================
// GET FILTERED REPORTS
// =========================================================

// Applies the search text, status filter, and date filter together.
function getFilteredItems() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedStatus = filterStatus.value;
    const selectedDate = filterDate.value;

    const filteredItems = items.filter(function(item) {
        const matchesText = matchesSearch(item, searchText);

        const matchesStatus =
            selectedStatus === "all" ||
            item.status === selectedStatus;

        const matchesDate = matchesDateFilter(item, selectedDate);

        // A report must match every active filter.
        return matchesText && matchesStatus && matchesDate;
    });

    return sortFilteredItems(filteredItems);
}


// =========================================================
// DISPLAY REPORTS
// =========================================================

// Displays reports that match the active filters.
function displayItems() {
    // Clear the old report cards.
    itemsContainer.replaceChildren();

    const filteredItems = getFilteredItems();

    // Update the count of matching reports.
    resultCount.textContent =
        `${filteredItems.length} report${filteredItems.length === 1 ? "" : "s"} found`;

    // Show a helpful message when there are no matching reports.
    if (filteredItems.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.className = "no-items";

        if (items.length === 0) {
            emptyMessage.textContent =
                "No reports yet. Add a lost or found item above.";
        } else {
            emptyMessage.textContent =
                "No matching reports found. Try changing your search or filters.";
        }

        itemsContainer.appendChild(emptyMessage);
        return;
    }

    // Create a card for each report.
    filteredItems.forEach(function(item) {
        const itemCard = document.createElement("article");
        itemCard.className = "item-card";

        // Item name.
        const itemTitle = document.createElement("h3");
        itemTitle.textContent = item.name || "Unnamed Item";

        // Status.
        const statusParagraph = document.createElement("p");
        const statusLabel = document.createElement("strong");
        const statusValue = document.createElement("span");

        statusLabel.textContent = "Status: ";
        statusValue.className = "status";
        statusValue.textContent = item.status || "Unknown";

        if (item.status === "Lost") {
            statusValue.classList.add("status-lost");
        } else if (item.status === "Found") {
            statusValue.classList.add("status-found");
        }

        statusParagraph.append(statusLabel, statusValue);

        // Description.
        const descriptionParagraph = document.createElement("p");
        const descriptionLabel = document.createElement("strong");

        descriptionLabel.textContent = "Description: ";

        descriptionParagraph.append(
            descriptionLabel,
            document.createTextNode(
                item.description || "No description provided."
            )
        );

        // Location.
        const locationParagraph = document.createElement("p");
        const locationLabel = document.createElement("strong");

        locationLabel.textContent = "Location: ";

        locationParagraph.append(
            locationLabel,
            document.createTextNode(item.location || "Not provided")
        );

        // Reporter name.
        const reporterParagraph = document.createElement("p");
        const reporterLabel = document.createElement("strong");

        reporterLabel.textContent = "Reported by: ";

        reporterParagraph.append(
            reporterLabel,
            document.createTextNode(item.reporter || "Not provided")
        );

        // Contact number.
        const contactParagraph = document.createElement("p");
        const contactLabel = document.createElement("strong");

        contactLabel.textContent = "Contact: ";

        contactParagraph.append(
            contactLabel,
            document.createTextNode(item.contact || "Not provided")
        );

        // Report date.
        const dateParagraph = document.createElement("p");
        const dateLabel = document.createElement("strong");

        dateLabel.textContent = "Date Reported: ";

        dateParagraph.append(
            dateLabel,
            document.createTextNode(item.reportDate || "Not recorded")
        );

        // Delete button.
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.setAttribute(
            "aria-label",
            `Delete report for ${item.name || "unnamed item"}`
        );

        // The report ID identifies which report should be deleted.
        deleteButton.addEventListener("click", function() {
            deleteItem(item.id);
        });

        // Put the report information into the card.
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

        itemsContainer.appendChild(itemCard);
    });
}


// =========================================================
// ADD A NEW REPORT
// =========================================================

// Runs when the user submits the report form.
itemForm.addEventListener("submit", function(event) {
    event.preventDefault();

    // Read and trim the form values.
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

    // Prevent fields containing only spaces from being accepted.
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

    // Check that the contact number uses acceptable characters.
    const validContact = /^[0-9+() -]{7,20}$/.test(contactNumber);

    if (!validContact) {
        alert("Please enter a valid contact number.");
        document.getElementById("contactNumber").focus();
        return;
    }

    // Reject invalid dates and dates later than today.
    if (
        !reportDate ||
        Number.isNaN(new Date(`${reportDate}T12:00:00`).getTime()) ||
        reportDate > getTodayDate()
    ) {
        alert("Please select a valid report date that is not in the future.");
        reportDateInput.focus();
        return;
    }

    // Create the new report object.
    const newItem = {
        id: Date.now(),
        name: itemName,
        status: itemStatus,
        description: itemDescription,
        location: itemLocation,
        reporter: reporterName,
        contact: contactNumber,
        reportDate: reportDate
    };

    // Add and save the report.
    items.push(newItem);
    saveItems();

    // Reset the form and restore today's date.
    itemForm.reset();
    reportDateInput.value = getTodayDate();

    // Refresh the results without clearing the user's active filters.
    displayItems();

    alert("Item report added successfully!");
});


// =========================================================
// DELETE A REPORT
// =========================================================

// Deletes a report after confirmation.
function deleteItem(id) {
    const confirmDelete = confirm(
        "Are you sure you want to delete this report?"
    );

    if (!confirmDelete) {
        return;
    }

    // Remove the selected report by its unique ID.
    items = items.filter(function(item) {
        return item.id !== id;
    });

    // Save the updated array and refresh the results.
    saveItems();
    displayItems();
}


// =========================================================
// RESET FILTERS
// =========================================================

// Clears search and restores the default filter and sort settings.
function resetFilters() {
    searchInput.value = "";
    filterStatus.value = "all";
    filterDate.value = "all";
    sortReports.value = "newest";

    displayItems();
}


// =========================================================
// EVENT LISTENERS
// =========================================================

// Update results while the user types.
searchInput.addEventListener("input", displayItems);

// Update results when the status filter changes.
filterStatus.addEventListener("change", displayItems);

// Update results when the date filter changes.
filterDate.addEventListener("change", displayItems);

// Update results when the sorting option changes.
sortReports.addEventListener("change", displayItems);

// Reset all search and filter controls.
resetFiltersButton.addEventListener("click", resetFilters);


// =========================================================
// INITIAL PAGE SETUP
// =========================================================

// Set today's date as the default date for new reports.
reportDateInput.value = getTodayDate();

// Display all saved reports when the page opens.
displayItems();
