
/**
* Utility function to calculate the current theme setting.
* Look for a local storage value.
* Fall back to system setting.
* Fall back to light mode.
*/
function calculateSettingAsThemeString({ localStorageTheme, systemSettingDark }) {
    if (localStorageTheme !== null) {
      return localStorageTheme;
    }
  
    if (systemSettingDark.matches) {
      return "dark";
    }
  
    return "light";
  }
  
  /**
  * Utility function to update the button text and aria-label.
  */
  function updateButton({ buttonEl, isDark }) {
    const newCta = isDark ? "header__themeToggle" : "header__themeToggle header__themeToggle--light";
    // use an aria-label if you are omitting text on the button
    // and using a sun/moon icon, for example
    buttonEl.setAttribute("aria-label", "a");
    buttonEl.setAttribute("class", newCta);
    //buttonEl.innerText = newCta;
  }
  
  /**
  * Utility function to update the theme setting on the html tag
  */
  function updateThemeOnHtmlEl({ theme }) {
    document.querySelector("html").setAttribute("data-theme", theme);
  }
  
  
  /**
  * On page load:
  */
  
  /**
  * 1. Grab what we need from the DOM and system settings on page load
  */
  const button = document.querySelector("[data-theme-toggle]");
  const localStorageTheme = localStorage.getItem("theme");
  const systemSettingDark = window.matchMedia("(prefers-color-scheme: dark)");
  
  /**
  * 2. Work out the current site settings
  */
  let currentThemeSetting = calculateSettingAsThemeString({ localStorageTheme, systemSettingDark });
  
  /**
  * 3. Update the theme setting and button text accoridng to current settings
  */
  updateButton({ buttonEl: button, isDark: currentThemeSetting === "dark" });
  updateThemeOnHtmlEl({ theme: currentThemeSetting });
  
  /**
  * 4. Add an event listener to toggle the theme
  */
  button.addEventListener("click", (event) => {
    const newTheme = currentThemeSetting === "dark" ? "light" : "dark";
  
    localStorage.setItem("theme", newTheme);
    updateButton({ buttonEl: button, isDark: newTheme === "dark" });
    updateThemeOnHtmlEl({ theme: newTheme });
  
    currentThemeSetting = newTheme;
  }); 





function searchWord(word = null) {
    const inputElement = document.getElementById("wordInput");
    const definitionDiv = document.getElementById("definition");
    const previousSearchesList = document.getElementById("previousSearches");

    definitionDiv.innerHTML = ""; // Clear previous result
    if (word === null) {
        word = inputElement.value.toLowerCase();
    }
    if(word === ""){
        console.log("Fadlan wax raadi!");
        const notFoundCardDiv = document.createElement("div");
        notFoundCardDiv.classList.add("not-found-card");
        notFoundCardDiv.textContent = `Ciyaarta naga daayee, fadlan wax raadi, Saaxiib!`;
        definitionDiv.appendChild(notFoundCardDiv);
        return;
    }
    else {
        word = word.toLowerCase();
    }
    inputElement.value = '';  // Clear the input field

    fetch(`https://api.erey.ga:3001/api/search/${word}`)
        .then(response => response.json())
        .then(data => {
            let wordFound = Array.isArray(data) && data.length > 0;
            updatePreviousSearches(word, wordFound);
            
            if (wordFound) {
                data.forEach(result => {
                    const cardDiv = document.createElement("div");
                    cardDiv.classList.add("card");
                    
                    const dictionaryNameDiv = document.createElement("div");
                    dictionaryNameDiv.classList.add("dictionary-name");
                    dictionaryNameDiv.textContent = result.dictionary;
                    cardDiv.appendChild(dictionaryNameDiv);
                    
                    const wordTitleDiv = document.createElement("div");
                    wordTitleDiv.classList.add("word-title");
                    wordTitleDiv.textContent = `Erayga: ${result.word}`;
                    cardDiv.appendChild(wordTitleDiv);
                    
                    result.definitions.forEach(definition => {
                        const definitionTextDiv = document.createElement("div");
                        definitionTextDiv.classList.add("word-definition");
                        definitionTextDiv.textContent = definition;
                        cardDiv.appendChild(definitionTextDiv);
                    });

                    definitionDiv.appendChild(cardDiv);
                }
            );
            } else {
                const notFoundCardDiv = document.createElement("div");
                notFoundCardDiv.classList.add("not-found-card");
                notFoundCardDiv.textContent = `Erayga "${word}" lagama helin abwaannada aan hayno.`;
                definitionDiv.appendChild(notFoundCardDiv);
            }
        })
        .catch(error => {
            console.error('Error searching word:', error);
            updatePreviousSearches(word, false);
            const errorCardDiv = document.createElement("div");
            errorCardDiv.classList.add("error-card");
            errorCardDiv.textContent = "Cilad ayaa dhacday marka la raadinayay erayga. Fadlan mar kale isku day.";
            definitionDiv.appendChild(errorCardDiv);
        });
}


function updatePreviousSearches(word, found) {
    let previousSearches = JSON.parse(localStorage.getItem("previousSearches")) || [];
    let searchEntry = { word: word, found: found };
    
    // Remove the word if it already exists
    previousSearches = previousSearches.filter(entry => entry.word !== word);
    
    // Add the new entry at the beginning of the array
    previousSearches.unshift(searchEntry);
    
    // Limit the list to the last 10 searches
    previousSearches = previousSearches.slice(0, 10);
    
    localStorage.setItem("previousSearches", JSON.stringify(previousSearches));
    displayPreviousSearches();
}

function listAllEntries() {
    const definitionDiv = document.getElementById("definition");
    definitionDiv.innerHTML = ""; // Clear previous result

    fetch('https://api.erey.ga:3001/api/entries')
        .then(response => response.json())
        .then(entries => {
            entries.forEach(entry => {
                const cardDiv = document.createElement("div");
                cardDiv.classList.add("card");

                const dictionaryNameDiv = document.createElement("div");
                dictionaryNameDiv.classList.add("dictionary-name");
                dictionaryNameDiv.textContent = entry.dictionary;
                cardDiv.appendChild(dictionaryNameDiv);

                const wordTitleDiv = document.createElement("div");
                wordTitleDiv.classList.add("word-title");
                wordTitleDiv.textContent = `Word: ${entry.word}`;
                cardDiv.appendChild(wordTitleDiv);

                entry.definitions.forEach(definition => {
                    const definitionTextDiv = document.createElement("div");
                    definitionTextDiv.classList.add("word-definition");
                    definitionTextDiv.textContent = definition;
                    cardDiv.appendChild(definitionTextDiv);
                });

                definitionDiv.appendChild(cardDiv);
            });
        })
        .catch(error => {
            console.error('Error listing all entries:', error);
            const errorCardDiv = document.createElement("div");
            errorCardDiv.classList.add("error-card");
            errorCardDiv.textContent = "Cilad ayaa dhacday marka la soo bandhigayay dhammaan gelitaannada. Fadlan mar kale isku day.";
            definitionDiv.appendChild(errorCardDiv);
        });
}


function displayPreviousSearches() {
    const previousSearchesList = document.getElementById("previousSearches");
    previousSearchesList.innerHTML = "";
    
    let previousSearches = JSON.parse(localStorage.getItem("previousSearches")) || [];
    
    previousSearches.forEach(search => {
        const listItem = document.createElement("li");
        listItem.textContent = search.word;
        listItem.onclick = () => searchWord(search.word);
        
        if (!search.found) {
            listItem.style.color = 'red';
        }
        
        previousSearchesList.appendChild(listItem);
    });
}

function clearPreviousSearches() {
    localStorage.removeItem("previousSearches");
    displayPreviousSearches();
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', (event) => {
    displayPreviousSearches();
});