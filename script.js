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
    buttonEl.setAttribute("aria-label", "a");
    buttonEl.setAttribute("class", newCta);
  }
  
  /**
  * Utility function to update the theme setting on the html tag
  */
  function updateThemeOnHtmlEl({ theme }) {
    document.querySelector("html").setAttribute("data-theme", theme);
  }
  
  // Dictionary data structure to replace API
  let dictionaries = [];
  
  // Load dictionaries from local storage or initialize with empty array
  async function loadDictionaries() {
    try {
        const response = await fetch('dictionaries.json');
        const data = await response.json();
        dictionaries = data.dictionaries;
        localStorage.setItem('dictionaries', JSON.stringify(dictionaries));
    } catch (error) {
        console.error('Error loading dictionaries:', error);
        // Fallback to localStorage if fetch fails
        const storedDictionaries = localStorage.getItem('dictionaries');
        if (storedDictionaries) {
            dictionaries = JSON.parse(storedDictionaries);
        }
    }
  }
  
  function searchWord(word = null) {
    const inputElement = document.getElementById("wordInput");
    const definitionDiv = document.getElementById("definition");
    
    definitionDiv.innerHTML = ""; // Clear previous result
    
    if (word === null) {
        word = inputElement.value.toLowerCase();
    }
    
    if (word === "") {
        const notFoundCardDiv = document.createElement("div");
        notFoundCardDiv.classList.add("not-found-card");
        notFoundCardDiv.textContent = `Ciyaarta naga daayee, fadlan wax raadi, Saaxiib!`;
        definitionDiv.appendChild(notFoundCardDiv);
        return;
    }
    
    word = word.toLowerCase();
    inputElement.value = '';  // Clear the input field
  
    // Local search implementation
    const results = localSearch(word);
    let wordFound = results.length > 0;
    updatePreviousSearches(word, wordFound);
  
    if (wordFound) {
        displayResults(results, word, definitionDiv);
    } else {
        displayNotFound(word, definitionDiv);
    }
  }
  
  function localSearch(word) {
      const results = [];
      const normalizedWord = word.trim().toLowerCase();
  
      dictionaries.forEach(dictionary => {
          // Exact match (case-insensitive)
          const exactMatchKey = Object.keys(dictionary.data).find(
              key => key.toLowerCase() === normalizedWord
          );
  
          if (exactMatchKey) {
              results.push({
                  dictionary: dictionary.name,
                  word: exactMatchKey,
                  definitions: dictionary.data[exactMatchKey],
                  matchType: 'dhan',
                  score: 0
              });
          }
  
          // Fuzzy and partial matches
          Object.entries(dictionary.data).forEach(([dictWord, definitions]) => {
              if (dictWord.toLowerCase() === normalizedWord) return; // Skip exact matches we already found
              
              // Calculate similarity score using Levenshtein distance
              const score = calculateLevenshteinDistance(normalizedWord, dictWord.toLowerCase()) / 
                           Math.max(normalizedWord.length, dictWord.length);
              
              // Only include if score is below threshold (lower is better)
              if (score < 0.5) {  // Equivalent to Fuse.js threshold
                  results.push({
                      dictionary: dictionary.name,
                      word: dictWord,
                      definitions: definitions,
                      matchType: score <= 0.2 ? 'dhafan' : 'dhafandhaaf',
                      score: score
                  });
              }
          });
      });
  
      // Sort and limit results like the original
      return results
          .sort((a, b) => {
              if (a.matchType === 'dhan' && b.matchType !== 'dhan') return -1;
              if (b.matchType === 'dhan' && a.matchType !== 'dhan') return 1;
              return a.score - b.score;
          })
          .slice(0, 100);  // Limit to top 10 results
  }
  
  // Add Levenshtein distance calculation for better fuzzy matching
  function calculateLevenshteinDistance(str1, str2) {
      const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
      
      for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
      for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
      
      for (let j = 1; j <= str2.length; j++) {
          for (let i = 1; i <= str1.length; i++) {
              const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
              matrix[j][i] = Math.min(
                  matrix[j - 1][i] + 1,      // deletion
                  matrix[j][i - 1] + 1,      // insertion
                  matrix[j - 1][i - 1] + cost // substitution
              );
          }
      }
      
      return matrix[str2.length][str1.length];
  }
  
  // Add suggestion generation for not-found cases
  function getSuggestions(word) {
      const suggestions = [];
      const normalizedWord = word.trim().toLowerCase();
      
      dictionaries.forEach(dictionary => {
          Object.entries(dictionary.data)
              .map(([dictWord, definitions]) => {
                  const score = calculateLevenshteinDistance(normalizedWord, dictWord.toLowerCase()) / 
                               Math.max(normalizedWord.length, dictWord.length);
                  return {
                      word: dictWord,
                      dictionary: dictionary.name,
                      score: score
                  };
              })
              .filter(result => result.score < 0.5)  // Only include reasonably close matches
              .slice(0, 3)  // Top 3 suggestions per dictionary
              .forEach(suggestion => suggestions.push(suggestion));
      });
  
      return suggestions
          .sort((a, b) => a.score - b.score)
          .slice(0, 5);  // Top 5 overall suggestions
  }
  
  function displayResults(results, searchWord, definitionDiv) {
    const matchTypes = {
        dhan: [],
        dhafan: [],
        dhafandhaaf: []
    };
  
    results.forEach(result => {
        matchTypes[result.matchType].push(result);
    });
  
    Object.entries(matchTypes).forEach(([matchType, typeResults]) => {
        if (typeResults.length > 0) {
            const categoryHeader = document.createElement("div");
            categoryHeader.classList.add("match-category-header");
            categoryHeader.textContent = getMatchCategoryTitle(matchType);
            categoryHeader.style.fontWeight = 'bold';
            categoryHeader.style.marginTop = '15px';
            categoryHeader.style.color = getMatchTypeColor(matchType);
            definitionDiv.appendChild(categoryHeader);
  
            typeResults.forEach(result => {
                createResultCard(result, searchWord, definitionDiv);
            });
        }
    });
  }
  
  function createResultCard(result, searchWord, definitionDiv) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    
    const matchTypeDiv = document.createElement("div");
    matchTypeDiv.classList.add("match-type");
    matchTypeDiv.textContent = `Barbartan: ${result.matchType.toUpperCase()}`;
    matchTypeDiv.style.color = getMatchTypeColor(result.matchType);
    cardDiv.appendChild(matchTypeDiv);
    
    const dictionaryNameDiv = document.createElement("div");
    dictionaryNameDiv.classList.add("dictionary-name");
    dictionaryNameDiv.textContent = result.dictionary;
    cardDiv.appendChild(dictionaryNameDiv);
    
    const wordTitleDiv = document.createElement("div");
    wordTitleDiv.classList.add("word-title");
    wordTitleDiv.innerHTML = `Erayga: ${highlightMatches(result.word, searchWord)}`;
    cardDiv.appendChild(wordTitleDiv);
    
    result.definitions.forEach(definition => {
        const definitionTextDiv = document.createElement("div");
        definitionTextDiv.classList.add("word-definition");
        definitionTextDiv.innerHTML = highlightMatches(definition, searchWord);
        cardDiv.appendChild(definitionTextDiv);
    });
  
    definitionDiv.appendChild(cardDiv);
  }
  
  // Update displayNotFound to include suggestions
  function displayNotFound(word, definitionDiv) {
      const notFoundCardDiv = document.createElement("div");
      notFoundCardDiv.classList.add("not-found-card");
      notFoundCardDiv.textContent = `Erayga "${word}" lagama helin abwaannada aan hayno.`;
      
      const suggestions = getSuggestions(word);
      
      if (suggestions.length > 0) {
          const suggestionsDiv = document.createElement("div");
          suggestionsDiv.classList.add("suggestions");
          
          const suggestionsTitle = document.createElement("div");
          suggestionsTitle.classList.add("suggestions-title");
          suggestionsTitle.textContent = "Ba'da sugeyso:";
          suggestionsDiv.appendChild(suggestionsTitle);
          
          const suggestionsList = document.createElement("ul");
          suggestionsList.classList.add("suggestions-list");
          
          suggestions.forEach(suggestion => {
              const suggestionItem = document.createElement("li");
              suggestionItem.innerHTML = `
                  <span class="suggestion-word">${suggestion.word}</span>
                  <span class="suggestion-dictionary">(${suggestion.dictionary})</span>
              `;
              suggestionItem.addEventListener('click', () => searchWord(suggestion.word));
              suggestionsList.appendChild(suggestionItem);
          });
          
          suggestionsDiv.appendChild(suggestionsList);
          notFoundCardDiv.appendChild(suggestionsDiv);
      }
      
      definitionDiv.appendChild(notFoundCardDiv);
  }
  
  
  function updatePreviousSearches(word, found, matchType = null) {
    let previousSearches = JSON.parse(localStorage.getItem("previousSearches")) || [];
    let searchEntry = { 
        word: word, 
        found: found,
        matchType: matchType || (found ? 'dhan' : null)
    };
  
    previousSearches = previousSearches.filter(entry => entry.word !== word);
    previousSearches.unshift(searchEntry);
    previousSearches = previousSearches.slice(0, 10);
  
    localStorage.setItem("previousSearches", JSON.stringify(previousSearches));
    displayPreviousSearches();
  }
  
  function displayPreviousSearches() {
    const previousSearchesList = document.getElementById("previousSearches");
    previousSearchesList.innerHTML = "";
  
    let previousSearches = JSON.parse(localStorage.getItem("previousSearches")) || [];
  
    previousSearches.forEach(search => {
        const listItem = document.createElement("li");
        listItem.textContent = search.word;
        
        if (!search.found) {
            listItem.style.color = 'red';
            listItem.classList.add('not-found');
        } else if (search.matchType) {
            listItem.style.color = getMatchTypeColor(search.matchType);
        }
  
        listItem.onclick = () => searchWord(search.word);
        previousSearchesList.appendChild(listItem);
    });
  }
  
  function getMatchCategoryTitle(matchType) {
    switch(matchType) {
        case 'dhan': return 'Barbartanno Dhan';
        case 'dhafan': return 'Barbartanno Dhafan';
        case 'dhafandhaaf': return 'Barbartanno Dhafandhaaf';
        default: return 'Barbatanno';
    }
  }
  
  function getMatchTypeColor(matchType) {
    switch(matchType) {
        case 'dhan': return 'var(--accent)';
        case 'dhafan': return 'var(--code)';
        case 'dhafandhaaf': return 'var(--text-light)';
        default: return 'var(--text)';
    }
  }
  
  function highlightMatches(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
  
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  function clearPreviousSearches() {
    localStorage.removeItem("previousSearches");
    displayPreviousSearches();
  }
  
  // Initialize everything when the DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    // Theme setup
    const button = document.querySelector("[data-theme-toggle]");
    const localStorageTheme = localStorage.getItem("theme");
    const systemSettingDark = window.matchMedia("(prefers-color-scheme: dark)");
  
    let currentThemeSetting = calculateSettingAsThemeString({ localStorageTheme, systemSettingDark });
  
    updateButton({ buttonEl: button, isDark: currentThemeSetting === "dark" });
    updateThemeOnHtmlEl({ theme: currentThemeSetting });
  
    button.addEventListener("click", (event) => {
        const newTheme = currentThemeSetting === "dark" ? "light" : "dark";
        localStorage.setItem("theme", newTheme);
        updateButton({ buttonEl: button, isDark: newTheme === "dark" });
        updateThemeOnHtmlEl({ theme: newTheme });
        currentThemeSetting = newTheme;
    });
  
    // Setup highlight toggle
    const headerElement = document.querySelector('body > header');
    const highlightToggle = document.createElement("div");
    highlightToggle.classList.add("highlight-toggle-container");
    highlightToggle.innerHTML = `
        <span class="highlight-toggle-label"></span>
        <label class="toggle-switch">
            <input type="checkbox" id="highlightToggle" checked>
            <span class="toggle-slider"></span>
        </label>
    `;
    headerElement.appendChild(highlightToggle);
  
    const highlightToggleCheckbox = document.getElementById("highlightToggle");
    const definitionDiv = document.getElementById("definition");
  
    highlightToggleCheckbox.addEventListener('change', (event) => {
        if (event.target.checked) {
            definitionDiv.classList.remove('no-highlights');
        } else {
            definitionDiv.classList.add('no-highlights');
        }
    });
  
    // Setup search functionality
    document.getElementById("searchButton").addEventListener("click", () => searchWord());
    document.getElementById("wordInput").addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            searchWord();
        }
    });
  
    // Load initial data
    loadDictionaries();
    displayPreviousSearches();
  });