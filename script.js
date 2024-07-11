
let dictionaries = [];

document.addEventListener('DOMContentLoaded', () => {
    fetch('dictionaries.json')
        .then(response => response.json())
        .then(data => {
            dictionaries = data.dictionaries;
            console.log('Abwaannada:', dictionaries);
            loadPreviousSearches();
        })
        .catch(error => console.error('Error loading dictionaries:', error));
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

    

    let previousSearches = JSON.parse(localStorage.getItem("previousSearches")) || [];
    if (!previousSearches.includes(word)) {
        previousSearches.push(word);
        localStorage.setItem("previousSearches", JSON.stringify(previousSearches));
    }

    previousSearchesList.innerHTML = "";
    previousSearches.forEach(search => {
        const listItem = document.createElement("li");
        listItem.textContent = search;
        listItem.onclick = () => searchWord(search);

        if (!isWordInDictionaries(search)) {
            listItem.classList.add("not-found");
        }

        previousSearchesList.appendChild(listItem);
    });

    let wordFound = false;
    dictionaries.forEach(dictionary => {
        const lowerCaseDict = {};
        Object.keys(dictionary.data).forEach(key => {
            lowerCaseDict[key.toLowerCase()] = dictionary.data[key];
        });

        if (lowerCaseDict[word]) {
            const cardDiv = document.createElement("div");
            cardDiv.classList.add("card");

            const dictionaryNameDiv = document.createElement("div");
            dictionaryNameDiv.classList.add("dictionary-name");
            dictionaryNameDiv.textContent = dictionary.name;
            cardDiv.appendChild(dictionaryNameDiv);

            const wordTitleDiv = document.createElement("div");
            wordTitleDiv.classList.add("word-title");
            wordTitleDiv.textContent = `Erayga: ${word}`;
            cardDiv.appendChild(wordTitleDiv);

            lowerCaseDict[word].forEach(definition => {
                const definitionTextDiv = document.createElement("div");
                definitionTextDiv.classList.add("word-definition");
                definitionTextDiv.textContent = definition;
                cardDiv.appendChild(definitionTextDiv);
            });

            definitionDiv.appendChild(cardDiv);
            wordFound = true;
        }
    });

    if (!wordFound) {
        const notFoundCardDiv = document.createElement("div");
        notFoundCardDiv.classList.add("not-found-card");
        notFoundCardDiv.textContent = `Erayga "${word}" lagama helin abwaannada aan hayno.`;
        definitionDiv.appendChild(notFoundCardDiv);
    }
}

function listAllEntries() {
    const definitionDiv = document.getElementById("definition");
    definitionDiv.innerHTML = ""; // Clear previous result

    dictionaries.forEach(dictionary => {
        Object.keys(dictionary.data).forEach(word => {
            const cardDiv = document.createElement("div");
            cardDiv.classList.add("card");

            const dictionaryNameDiv = document.createElement("div");
            dictionaryNameDiv.classList.add("dictionary-name");
            dictionaryNameDiv.textContent = dictionary.name;
            cardDiv.appendChild(dictionaryNameDiv);

            const wordTitleDiv = document.createElement("div");
            wordTitleDiv.classList.add("word-title");
            wordTitleDiv.textContent = `Word: ${word}`;
            cardDiv.appendChild(wordTitleDiv);

            dictionary.data[word].forEach(definition => {
                const definitionTextDiv = document.createElement("div");
                definitionTextDiv.classList.add("word-definition");
                definitionTextDiv.textContent = definition;
                cardDiv.appendChild(definitionTextDiv);
            });

            definitionDiv.appendChild(cardDiv);
        });
    });
}

function clearPreviousSearches() {
    localStorage.removeItem("previousSearches");
    const previousSearchesList = document.getElementById("previousSearches");
    previousSearchesList.innerHTML = "";
}

function loadPreviousSearches() {
    const previousSearches = JSON.parse(localStorage.getItem("previousSearches")) || [];
    const previousSearchesList = document.getElementById("previousSearches");

    previousSearches.forEach(search => {
        const listItem = document.createElement("li");
        listItem.textContent = search;
        listItem.onclick = () => searchWord(search);

        if (!isWordInDictionaries(search)) {
            listItem.classList.add("not-found");
        }

        previousSearchesList.appendChild(listItem);
    });
}

function isWordInDictionaries(word) {
    let wordFound = false;
    dictionaries.forEach(dictionary => {
        const lowerCaseDict = {};
        Object.keys(dictionary.data).forEach(key => {
            lowerCaseDict[key.toLowerCase()] = dictionary.data[key];
        });

        if (lowerCaseDict[word.toLowerCase()]) {
            wordFound = true;
        }
    });
    return wordFound;
}