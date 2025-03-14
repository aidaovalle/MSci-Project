document.getElementById("storyForm").addEventListener("submit", function(event) {
    event.preventDefault();

    // Get form values
    const character = document.getElementById("character").value.trim();
    const setting = document.getElementById("setting").value.trim();
    const feeling = document.getElementById("feeling").value.trim();
    
    // Check if required fields are filled
    if (!character || !setting || !feeling) {
        alert("Please fill in all required fields before generating the story.");
        return; // Stop form submission if fields are empty
    }
    
    const formData = new FormData(this);
    document.getElementById("loading").style.display = "block";

    fetch("/generate", { method: "POST", body: formData })
        .then(response => response.json())
        .then(data => {
            document.getElementById("loading").style.display = "none";
            document.getElementById("storyContainer").classList.remove("hidden");
            document.getElementById("storyText").textContent = data.story;

            loadPastStories();
        })
        .catch(error => {
            document.getElementById("loading").style.display = "none";
            alert("Error generating story: " + error);
        });
});

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
                    <p><strong>Prompt:</strong> ${story.prompt}</p>
                    <p class="mt-2"><strong>Story:</strong> ${story.story}</p>
                    `;
                    pastStoriesDiv.appendChild(storyElement);
                });
            });
    }
    
    // Load past stories on page load
    window.onload = loadPastStories;
