document.getElementById("storyForm").addEventListener("submit", function(event) {
    event.preventDefault();
    
    const formData = new FormData(this);
    document.getElementById("loading").style.display = "block";
    //document.getElementById("storyResult").classList.add("hidden");

    fetch("/", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("loading").style.display = "none";
        //document.getElementById("storyResult").classList.remove("hidden");
        document.getElementById("storyText").textContent = data.story;
        
        // Add new story to the past stories section
        let pastStoriesDiv = document.getElementById("pastStories");
        let newStory = document.createElement("div");
        newStory.classList.add("story-entry"); //thiw is the prompt that appears in thw generated story
        newStory.innerHTML = `<strong>Prompt:</strong> ${formData.get("character")}, ${formData.get("setting")}, ${formData.get("feeling")}, ${formData.get("extra")}<br>
                                <strong>Story:</strong> ${data.story}`;
        pastStoriesDiv.prepend(newStory);
    })
    .catch(error => {
        document.getElementById("loading").style.display = "none";
        alert("Error generating story: " + error);
    });
});
