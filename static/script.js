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

    fetch("/", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("loading").style.display = "none";
        document.getElementById("storyContainer").classList.remove("hidden");
        
        // Check that the storyText element exists        
        const storyTextElement = document.getElementById("storyText");
        if (storyTextElement) {
            storyTextElement.textContent = data.story;
        }

        // Add new story to the past stories section
        let pastStoriesDiv = document.getElementById("pastStories");
        if (pastStoriesDiv) {
            let newStory = document.createElement("div");
            newStory.classList.add("bg-gray-50", "p-4", "rounded-lg", "shadow-md", "mt-2");
            // newStory.classList.add("story-entry"); //this is the prompt that appears in the generated story

            newStory.innerHTML = `<p class="text-gray-700"><strong>Prompt:</strong> ${formData.get("character")}, 
                                  ${formData.get("setting")}, ${formData.get("feeling")}, ${formData.get("extra")}</p>
                                  <p class="mt-2"><strong>Story:</strong> ${data.story}</p>`;

            // newStory.innerHTML = `<strong>Prompt:</strong> ${formData.get("character")}, ${formData.get("setting")}, ${formData.get("feeling")}, ${formData.get("extra")}<br>
            //                     <strong>Story:</strong> ${data.story}`;
            pastStoriesDiv.prepend(newStory);
        }
    })
    .catch(error => {
        document.getElementById("loading").style.display = "none";
        alert("Error generating story: " + error);
    });
});
