let currentPrompt = "";
let currentStory = "";
let currentTitle = "";
let currentCharacter = "";
let currentSetting = "";
let storyToDelete = null;
let currentObserver = null;
let isEditing = false;
let allLibraryStories = [];
let allPastStories = [];

const deleteDialog = document.getElementById("delete-confirm-dialog");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const backToTopBtn = document.getElementById("backToTopBtn");

// Story generation ----------------------------------------------------------------------------
document.getElementById("storyForm").addEventListener("submit", function(event) {
    event.preventDefault();

    // Get form values
    const character = document.getElementById("character").value.trim();
    const setting = document.getElementById("setting").value.trim();
    const feeling = document.getElementById("feeling").value.trim();
    const length = document.getElementById("length").value.trim();

    // Check if required fields are filled, stops form submission if fields are empty
    if (!character || !setting || !feeling || !length) {
        alert("Please fill in all required fields before generating the story.");
        return; 
    }

    const formData = new FormData(this);
    formData.append("length", length);
    document.getElementById("loading").style.display = "block";

    fetch("/generate", { method: "POST", body: formData})
        .then(response => response.json())
        .then(displayGeneratedStory)
        .catch(error => {
            document.getElementById("loading").style.display = "none";
            alert("Error generating story: " + error);
        });
});

// Display generated story ----------------------------------------------------------------------------
function displayGeneratedStory(data) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("storyLoading").classList.add("hidden");
    document.getElementById("storyContent").classList.remove("hidden");
    document.getElementById("storyEmptyState").classList.add("hidden");

    document.getElementById("storyDisplayText").innerHTML = `
        <h3 class="text-xl font-semibold mb-2">${data.title}</h3>
        <p><strong>Story Details:</strong><br>${data.user_prompt}</p>
        <div class="mt-2"><strong>Story:</strong><br>${formatStoryAsParagraphs(data.story)}</div>
  `;
  
    currentPrompt = data.user_prompt;
    currentStory = data.story;
    currentTitle = data.title;
    currentCharacter = data.character;
    currentSetting = data.setting;

    document.getElementById("storyContainer").classList.remove("hidden");
    document.querySelector("sl-tab-group").show("generated-story");

    loadPastStories(); // Re-fetch

    fetch("/generate-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: data.story })
      })
        .then(res => res.json())
        .then(titleData => {
          if (titleData.title) {
            currentTitle = titleData.title;
            const titleElement = document.querySelector("#storyDisplayText h3");
            if (titleElement) titleElement.textContent = titleData.title;
          }
        })
        .catch(err => {
          console.warn("Failed to generate dynamic title:", err);
        });
      
}

// Format story as paragraphs ----------------------------------------------------------------------------
function formatStoryAsParagraphs(story) {
    return story
    .split(/\n\s*\n/) // Split by double newlines or blank lines
    .map(p => `<p class="mb-3">${p.trim()}</p>`)
    .join("");
}

// Save story to library ----------------------------------------------------------------------------
document.getElementById("saveLibraryBtn").addEventListener("click", function() {
    fetch("/save-to-library", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({ 
            prompt: currentPrompt, 
            story: currentStory, 
            title: currentTitle 
        })
    })
        .then(response => response.json())
        .then(data => {
            showAlert(data.status === "saved" ? "success" : "warning", data.message);
            if (data.status === "saved") {
                loadLibraryStories();
                document.querySelector('sl-tab-group').show('library');
            }
            // else, stay on generated-story tab
        })        
        .catch(error => {
            showAlert("danger", "Error saving to library: " + error);
        });
});

// Getting past stories ----------------------------------------------------------------------------
function loadPastStories() {
    return fetch("/get-stories")
        .then(response => response.json())
        .then(stories => {
            allPastStories = stories; // save globally
            renderPastStories(stories); // Always render
        });
}

// Showing past stories ----------------------------------------------------------------------------
function renderPastStories(stories) {
    const pastStoriesDiv = document.getElementById("pastStories");
    pastStoriesDiv.innerHTML = ""; // clear existing content

    if (!stories.length) {
        pastStoriesDiv.innerHTML = `
            <div class="text-center text-gray-500 italic mt-6">
                It’s quiet here… Go create something magical! ✨
            </div>
        `;
        return;
    }

    stories.forEach(story => {
        const storyElement = document.createElement("div");
        storyElement.classList.add("bg-gray-50", "p-4", "rounded-lg", "shadow-md", "mt-2");
        storyElement.innerHTML = `
            <h3 class="text-xl font-semibold mb-2">${story.title || "Untitled Story"}</h3>
            <p><strong>Story Details:</strong><br>${story.prompt}</p>
            <div class="mt-2"><strong>Story:</strong><br>${formatStoryAsParagraphs(story.story)}</div>
        `;
        
        pastStoriesDiv.appendChild(storyElement);
    });
}

// Getting library data ----------------------------------------------------------------------------
function loadLibraryStories() {
    return fetch("/get-library")
        .then(response => response.json())
        .then(stories => {
            allLibraryStories = stories; // Store in global variable
            renderLibraryStories(stories); // Display stories
        });
}

// Showing library data ----------------------------------------------------------------------------
function renderLibraryStories(stories) {
    const libraryDiv = document.getElementById("libraryStories");
    libraryDiv.innerHTML = ""; // clear previous stories

    if (!stories.length) {
        libraryDiv.innerHTML = `
            <div class="text-center text-gray-500 italic mt-6">
                It’s quiet here… Go create something magical! ✨
            </div>
        `;
        return;
    }

    stories.forEach(story => {
        const storyElement = document.createElement("div");
        storyElement.classList.add("bg-gray-50", "p-4", "rounded-lg", "shadow-md", "mt-2");
        storyElement.innerHTML = `
            <h3 class="text-xl font-semibold mb-2">${story.title || "Untitled Story"}</h3>
            <p><strong>Story Details:</strong><br>${story.prompt}</p>
            <p class="mt-2"><strong>Story:</strong><br>${story.story}</p>
            <button class="delete-btn mt-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
                Delete from Library
            </button>
        `;

        // Add delete listener
        storyElement.querySelector(".delete-btn").addEventListener("click", () => {
            storyToDelete = { prompt: story.prompt, story: story.story };
            deleteDialog.show();
        });

        libraryDiv.appendChild(storyElement);
    });
}


// Dialog for deleting story from library ----------------------------------------------------------------------------
confirmDeleteBtn.addEventListener("click", () => {
    if (!storyToDelete) return;

    fetch("/delete-from-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storyToDelete)
    })
        .then(response => response.json())
        .then(data => {
            showAlert("delete", data.message);
            loadLibraryStories();
        })
        .catch(error => {
            showAlert("danger", "Error deleting story: " + error);
        })
        .finally(() => {
            deleteDialog.hide();
            storyToDelete = null;
        });
});

cancelDeleteBtn.addEventListener("click", () => {
    deleteDialog.hide();
    storyToDelete = null; // optional: clear selected story
});

// Regenerate story ----------------------------------------------------------------------------
document.getElementById("regenerateBtn").addEventListener("click", () => {
    if (!currentPrompt) {
      showAlert("warning", "No prompt available to regenerate the story.");
      return;
    }
  
    document.getElementById("storyContent").classList.add("hidden");
    document.getElementById("storyLoading").classList.remove("hidden");
    document.getElementById("regenerateBtn").classList.add("hidden");
    document.getElementById("editBtn").classList.add("hidden");
    document.getElementById("saveLibraryBtn").classList.add("hidden");
    document.getElementById("saveEditedStoryBtn").classList.add("hidden");
     
    fetch("/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt: currentPrompt, 
        character: currentCharacter, 
        setting: currentSetting })
    })
      .then(response => response.json())
      .then(data => {
        displayGeneratedStory(data);
    
        document.getElementById("regenerateBtn").classList.remove("hidden");
        document.getElementById("editBtn").classList.remove("hidden");
        document.getElementById("saveLibraryBtn").classList.remove("hidden");
      })
      .catch(error => {
        document.getElementById("storyLoading").classList.add("hidden");
        showAlert("danger", "Error regenerating story: " + error);
      });
});
  
// Edit story ----------------------------------------------------------------------------
document.getElementById("editBtn").addEventListener("click", () => {
    const editBtn = document.getElementById("editBtn");
    const displayText = document.getElementById("storyDisplayText");
    const editText = document.getElementById("storyEditText");
    const saveEditedBtn = document.getElementById("saveEditedStoryBtn");
  
    if (!isEditing) {
      // Switch to edit mode
      editText.value = currentStory;
      displayText.classList.add("hidden");
      editText.classList.remove("hidden");
      editBtn.innerHTML = `<sl-icon name="check-circle"></sl-icon> Save Changes`;
      isEditing = true;
    } else {
      // Save edits
      currentStory = editText.value.trim();
      displayText.innerHTML = `
      <h3 class="text-xl font-semibold mb-2">${currentTitle}</h3>
      <p><strong>Story Details:</strong><br>${currentPrompt}</p>
      <p class="mt-2"><strong>Story:</strong><br>${currentStory}</p>
    `;
      displayText.classList.remove("hidden");
      editText.classList.add("hidden");
      editBtn.innerHTML = `<sl-icon name="pencil"></sl-icon> Edit Story`;
      isEditing = false;

      saveEditedBtn.classList.remove("hidden");
  
      showAlert("success", "Story updated! Don't forget to save it.");
    }
  });

  // Save edited story ----------------------------------------------------------------------------
  document.getElementById("saveEditedStoryBtn").addEventListener("click", () => {
    fetch("/save-to-past", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: currentPrompt,
        story: currentStory,
        title: currentTitle,
        edited: true
      })
    })
      .then(res => res.json())
      .then(data => {
        showAlert("success", data.message || "Edited story saved!");
        document.getElementById("saveEditedStoryBtn").classList.add("hidden");
        loadPastStories();
      })
      .catch(err => {
        showAlert("danger", "Failed to save edited story.");
      });
  });
  
// Tab switching and loading content ----------------------------------------------------------------------------
document.querySelector("sl-tab-group").addEventListener("sl-tab-show", (event) => {
    const activeTab = event.detail.name;
    // Track the open tab and load content only when tabs are opened for the first time
    if (activeTab === "library") {
        loadLibraryStories().then(() => {
            // Keep the filter if the search bar has text
            const query = document.getElementById("librarySearchInput").value.toLowerCase().trim();
            if (query) {
                const filtered = allLibraryStories.filter(
                    story => story.prompt && story.prompt.toLowerCase().includes(query)
                );
                renderLibraryStories(filtered);
            }
        });
    }

    if (activeTab === "past-stories") {
        loadPastStories().then(() => {
            const query = document.getElementById("pastSearchInput").value.toLowerCase().trim();
            if (query) {
                const filtered = allPastStories.filter(
                    story => story.prompt && story.prompt.toLowerCase().includes(query)
                );
                renderPastStories(filtered);
            }
        });
    }

    handleBackToTop(activeTab);
});

// Listen for input changes in the search bars ----------------------------------------------------------------------------
document.getElementById("librarySearchInput").addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase().trim();
    const filtered = query
        ? allLibraryStories.filter(story => 
            story.prompt && story.prompt.toLowerCase().includes(query))
        : allLibraryStories; // Show all stories if query is empty
    // Show the library with filtered stories
    renderLibraryStories(filtered);
});

document.getElementById("librarySearchInput").addEventListener("sl-clear", () => {
    renderLibraryStories(allLibraryStories);
});

document.getElementById("pastSearchInput").addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase().trim();
    const filtered = query
        ? allPastStories.filter(story => 
            story.prompt && story.prompt.toLowerCase().includes(query)) // Check if prompt exists and if it does, do the rest
        : allPastStories; // Show all stories if query is empty
    // Show the filtered past stories
    renderPastStories(filtered);
});

document.getElementById("pastSearchInput").addEventListener("sl-clear", () => {
    renderPastStories(allPastStories);
});
  
// Alerts ----------------------------------------------------------------------------
function showAlert(type, message) {
    const alert = document.getElementById("main-alert");
    const icon = document.getElementById("main-alert-icon");
    const textSpan = document.getElementById("main-alert-text");

    // Set alert type and message
    alert.variant = type; // Success, warning, danger, primary, etc.
    textSpan.textContent = message;

    const iconMap = {
        success: "check-circle",
        warning: "exclamation-triangle",
        danger: "x-circle",
        primary: "info-circle",
        delete: "trash3",
    };

    icon.name = iconMap[type] || "info-circle";
    alert.classList.remove("hidden");
    alert.open = true;

    // Scroll to alert
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Back to top button ----------------------------------------------------------------------------
function handleBackToTop(tabName) {
    if (currentObserver) currentObserver.disconnect();
    backToTopBtn.classList.add("hidden");

    if (!["library", "past-stories", "generated-story"].includes(tabName)) return;

    const tabPanel = document.querySelector(`sl-tab-panel[name="${tabName}"]`);

    // Remove old marker if it exists
    const oldMarker = tabPanel.querySelector(".scroll-marker");
    if (oldMarker) oldMarker.remove();

    // Add new marker
    const marker = document.createElement("div");
    marker.style.height = "1px";
    marker.classList.add("scroll-marker");
    tabPanel.prepend(marker);

    currentObserver = new IntersectionObserver(([entry]) => {
        backToTopBtn.classList.toggle("hidden", entry.isIntersecting);
    }, { threshold: 0 });

    currentObserver.observe(marker);
}

backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});
