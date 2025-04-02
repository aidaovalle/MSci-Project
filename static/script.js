let currentPrompt = "";
let currentStory = "";

// Story generation
document.getElementById("storyForm").addEventListener("submit", function(event) {
    event.preventDefault();

    // Get form values
    const character = document.getElementById("character").value.trim();
    const setting = document.getElementById("setting").value.trim();
    const feeling = document.getElementById("feeling").value.trim();

    // Check if required fields are filled, stops form submission if fields are empty
    if (!character || !setting || !feeling) {
        alert("Please fill in all required fields before generating the story.");
        return; 
    }

    const formData = new FormData(this);
    document.getElementById("loading").style.display = "block";

    fetch("/generate", { method: "POST", body: formData})
        .then(response => response.json())
        .then(displayGeneratedStory)
        .catch(error => {
            document.getElementById("loading").style.display = "none";
            alert("Error generating story: " + error);
        });
});

// Display generated story
function displayGeneratedStory(data) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("storyContainer").classList.remove("hidden");

    document.getElementById("storyText").innerHTML = `
        <p><strong>Story Details:</strong><br>${data.user_prompt}</p>
        <p class="mt-2"><strong>Story:</strong><br>${data.story}</p>
    `;
    currentPrompt = data.user_prompt;
    currentStory = data.story;
    document.getElementById("saveLibraryBtn").classList.remove("hidden");
    document.querySelector("sl-tab-group").show("generated-story");
    loadPastStories();
}

// Send story to library
document.getElementById("saveLibraryBtn").addEventListener("click", function() {
    fetch("/save-to-library", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({ prompt: currentPrompt, story: currentStory })
        })
        .then(response => response.json())
        .then(data => {
            showAlert(data.status === "saved" ? "success" : "warning", data.message);
            loadLibraryStories();
            document.querySelector('sl-tab-group').show('library');
        })        
        .catch(error => {
            showAlert("danger", "Error saving to library: " + error);
        });
});
// Load past stories
function loadPastStories() {
    fetch("/get-stories")
        .then(response => response.json())
        .then(stories => {
            let pastStoriesDiv = document.getElementById("pastStories");
            pastStoriesDiv.innerHTML = ""; // Clear previous
            stories.forEach(story => {
                let storyElement = document.createElement("div");
                storyElement.classList.add("bg-gray-50", "p-4", "rounded-lg", "shadow-md", "mt-2");
                storyElement.innerHTML = `
                    <p><strong>Story Details:</strong><br>${story.prompt}</p>
                    <p class="mt-2"><strong>Story:</strong><br>${story.story}</p>
                    `;
                pastStoriesDiv.appendChild(storyElement);
            });
        });
}

// Load library
function loadLibraryStories() {
    fetch("/get-library")
        .then(response => response.json())
        .then(stories => {
            let libraryDiv = document.getElementById("libraryStories");
            libraryDiv.innerHTML = ""; // Clear previous
            stories.forEach(story => {
                let storyElement = document.createElement("div");
                storyElement.classList.add("bg-gray-50", "p-4", "rounded-lg", "shadow-md");
                storyElement.innerHTML = `
                    <p><strong>Story Details:</strong><br>${story.prompt}</p>
                    <p class="mt-2"><strong>Story:</strong><br>${story.story}</p>
                    <button class="delete-btn mt-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
                        Delete from Library
                    </button>
                    `;

                // Add event listener for delete button
                storyElement.querySelector(".delete-btn").addEventListener("click", function () {
                    fetch("/delete-from-library", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ prompt: story.prompt, story: story.story })
                    })
                    .then(response => response.json())
                    .then(data => {
                        showAlert("primary", data.message);
                        loadLibraryStories(); // Refresh the tab after deletion
                    })
                    .catch(error => {
                        showAlert("danger", "Error deleting story: " + error);
                    });
                });

                libraryDiv.appendChild(storyElement);
            });
        });
}

// Load library once, not each time it's opened
document.querySelector("sl-tab-group").addEventListener("sl-tab-show", (event) => {
    if (event.detail.name === "library") {
        loadLibraryStories();
    }
});

function showAlert(type, message) {
    const alert = document.getElementById("main-alert");
    const textSpan = document.getElementById("main-alert-text");

    // Set alert type
    alert.variant = type; // "success", "warning", "danger", "primary", etc.

    // Set message
    textSpan.textContent = message;

    // Show alert
    alert.classList.remove("hidden");
    alert.open = true;
}

// Load past stories on page load
window.onload = loadPastStories;