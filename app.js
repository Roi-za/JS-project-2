const omdbApiKey = 'a7795d70'; 

// Fetch theatre areas when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const areaSelect = document.getElementById("areaSelect"); // Dropdown for areas

  // Fetch theatre areas from the Finnkino API
  fetch("https://www.finnkino.fi/xml/TheatreAreas/")
    .then(response => response.text()) // Ensure we get XML data
    .then(xmlString => {
      const parser = new DOMParser(); // Create an XML parser
      const xml = parser.parseFromString(xmlString, "text/xml"); // Parse the XML string
      const areas = xml.getElementsByTagName("TheatreArea"); // Get all theatre areas

      // Add areas to the dropdown menu
      for (const area of areas) {
        const id = area.getElementsByTagName("ID")[0].textContent; // Area ID
        const name = area.getElementsByTagName("Name")[0].textContent; // Area name
        const option = document.createElement("option"); // Create a dropdown option
        option.value = id; // The area ID is the option value
        option.textContent = name; // The area name is displayed in the dropdown
        areaSelect.appendChild(option); // Add area to the dropdown
      }
    })
    .catch(error => console.error("Error fetching areas:", error)); // Error handling if fetching areas fails
});

// Fetch movie description from the OMDB API
function getMovieDescription(movieTitle) {
  const url = `https://www.omdbapi.com/?t=${encodeURIComponent(movieTitle)}&apikey=${omdbApiKey}`; // Create URL to fetch movie data

  return fetch(url) // Fetch movie details
    .then(response => response.json()) // Convert response to JSON
    .then(data => {
      if (data.Response === 'True') {
        return data.Plot || 'No description available'; // If description is found, return it
      } else {
        return 'No description available'; // If no description is found
      }
    })
    .catch(error => {
      console.error("Error fetching description:", error); // Error handling if fetching description fails
      return 'No description available'; // If description is not available
    });
}

// Fetch and display schedule for the selected area
document.getElementById("fetchScheduleBtn").addEventListener("click", () => {
  const areaId = document.getElementById("areaSelect").value; // Get the selected area
  const dateInput = document.getElementById("datePicker").value; // Get the selected date
  const resultsContainer = document.getElementById("resultsContainer"); // Container for displaying movie cards

  if (!areaId) {
    alert("Please select an area!"); // Show alert if no area is selected
    return;
  }

  // Format the date
  const today = new Date().toISOString().split("T")[0];
  const formattedDate = dateInput ? dateInput.split("-").reverse().join(".") : today.split("-").reverse().join(".");

  resultsContainer.innerHTML = ""; // Clear previous results

  // Fetch schedule for the selected area and date
  fetch(`https://www.finnkino.fi/xml/Schedule/?area=${areaId}&dt=${formattedDate}`)
    .then(response => response.text()) // Fetch XML data for the schedule
    .then(xmlString => {
      const parser = new DOMParser(); // Create an XML parser
      const xml = parser.parseFromString(xmlString, "text/xml"); // Parse the XML string
      const shows = xml.getElementsByTagName("Show"); // Get all movie shows

      // If no shows are available, display an error message
      if (shows.length === 0) {
        resultsContainer.innerHTML = "<p class='error'>No shows available for this area.</p>";
        return;
      }

      // Loop through each movie show and create movie cards
      for (const show of shows) {
        const title = show.getElementsByTagName("Title")[0].textContent; // Movie title
        const theatre = show.getElementsByTagName("Theatre")[0].textContent; // Theatre name
        const time = show.getElementsByTagName("dttmShowStart")[0].textContent; // Show start time
        const poster = show.getElementsByTagName("EventLargeImagePortrait")[0]?.textContent 
          || show.getElementsByTagName("EventSmallImagePortrait")[0]?.textContent 
          || "https://via.placeholder.com/200x300?text=No+Image"; // Movie poster (placeholder if no image)

        // Create a movie card
        const card = document.createElement("div");
        card.classList.add("movieCard");
        card.innerHTML = `
          <img src="${poster}" alt="${title}">
          <h3>${title}</h3>
          <p><strong>Theatre:</strong> ${theatre}</p>
          <p><strong>Time:</strong> ${new Date(time).toLocaleString()}</p>
        `;

        // When clicking a movie card, fetch and display the description
        card.addEventListener("click", () => {
          getMovieDescription(title).then(description => {
            document.getElementById("modalTitle").textContent = title; // Display movie title in modal
            document.getElementById("modalDescription").textContent = description; // Display movie description
            document.getElementById("modalDuration").textContent = "Duration: 120 minutes"; // Movie duration (hardcoded)
            document.getElementById("movieModal").style.display = "flex"; // Show the modal window
          });
        });

        resultsContainer.appendChild(card); // Add the movie card to the results
      }
    })
    .catch(error => {
      console.error("Error fetching schedule:", error); // Error handling if schedule fetching fails
      resultsContainer.innerHTML = "<p class='error'>An error occurred while fetching schedule.</p>";
    });
});

// Movie search field to filter movies by title
document.getElementById("searchInput").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase(); // Get the search query
  const movieCards = document.querySelectorAll(".movieCard"); // Get all movie cards

  movieCards.forEach(card => {
    const title = card.querySelector("h3").textContent.toLowerCase(); // Movie title
    card.style.display = title.includes(query) ? "block" : "none"; // Filter movies by search query
  });
});

// Sorting movies by time or title
document.getElementById("sortSelect").addEventListener("change", (e) => {
  const sortBy = e.target.value; // Get the selected sorting criterion
  const movieCards = Array.from(document.querySelectorAll(".movieCard")); // Get all movie cards
  const container = document.getElementById("resultsContainer");

  const sortedCards = movieCards.sort((a, b) => {
    if (sortBy === "time") {
      const timeA = new Date(a.querySelector("p:last-child").textContent.split(": ")[1]); // Movie time
      const timeB = new Date(b.querySelector("p:last-child").textContent.split(": ")[1]);
      return timeA - timeB; // Sort by time
    } else if (sortBy === "title") {
      return a.querySelector("h3").textContent.localeCompare(b.querySelector("h3").textContent); // Sort by title
    }
  });

  container.innerHTML = ""; // Clear the results
  sortedCards.forEach(card => container.appendChild(card)); // Add the sorted cards back
});

// Close the modal window
document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("movieModal").style.display = "none"; // Close the modal
});
