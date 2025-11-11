const generations = [
    { id: 1, name: "Gen 1: Kanto", start: 1, end: 151, color: "#FF0000" },
    { id: 2, name: "Gen 2: Johto", start: 152, end: 251, color: "#2196F3" },
    { id: 3, name: "Gen 3: Hoenn", start: 252, end: 386, color: "#4CAF50" },
    { id: 4, name: "Gen 4: Sinnoh", start: 387, end: 493, color: "#9C27B0" },
    { id: 5, name: "Gen 5: Unova", start: 494, end: 649, color: "#FF9800" },
    { id: 6, name: "Gen 6: Kalos", start: 650, end: 721, color: "#00BCD4" },
    { id: 7, name: "Gen 7: Alola", start: 722, end: 809, color: "#FFC107" },
    { id: 8, name: "Gen 8: Galar", start: 810, end: 905, color: "#795548" },
    { id: 9, name: "Gen 9: Paldea", start: 906, end: 1025, color: "#E91E63" }
];


const pokemonList = document.getElementById('pokemonList');
const searchInput = document.getElementById('searchInput');
const generationSelector = document.getElementById('generationSelector');
const generationInfo = document.getElementById('generationInfo');


let allPokemons = [];
let currentGeneration = 1;
let isLoading = false;
let isSearching = false;
let currentDisplayedPokemons = [];


const pokemonCache = new Map();


document.addEventListener('DOMContentLoaded', () => {
    initializeGenerationButtons();
    loadGeneration(1);
    setupSearch();
});


function initializeGenerationButtons() {
    generations.forEach(gen => {
        const button = document.createElement('button');
        button.className = 'gen-btn';
        button.textContent = gen.name;
        button.dataset.gen = gen.id;
        
        button.addEventListener('click', () => {
            if (currentGeneration !== gen.id && !isLoading) {

                document.querySelectorAll('.gen-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                

                button.classList.add('active');
                

                loadGeneration(gen.id);
                isSearching = false;
            }
        });
        
        generationSelector.appendChild(button);
    });
    

    document.querySelector(`.gen-btn[data-gen="1"]`).classList.add('active');
}


async function loadGeneration(genId) {
    isLoading = true;
    currentGeneration = genId;
    
    const generation = generations.find(g => g.id === genId);
    generationInfo.textContent = `${generation.name} - Pokémons ${generation.start} a ${generation.end}`;
    

    if (pokemonCache.has(genId)) {
        const cachedPokemons = pokemonCache.get(genId);
        allPokemons = cachedPokemons;
        currentDisplayedPokemons = cachedPokemons;
        displayPokemons(cachedPokemons);
        isLoading = false;
        return;
    }
    

    pokemonList.classList.add('fade-out');
    

    setTimeout(() => {
        pokemonList.innerHTML = '<div class="loading">Carregando Pokémons...</div>';
        pokemonList.classList.remove('fade-out');
        

        fetchGenerationPokemons(generation.start, generation.end, genId);
    }, 300);
}


async function fetchGenerationPokemons(start, end, genId) {
    try {
        const generationPokemons = [];
        

        const promises = [];
        for (let i = start; i <= end; i++) {
            promises.push(fetchPokemonData(i));
        }
        

        const results = await Promise.allSettled(promises);
        

        generationPokemons.push(...results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value)
        );
        

        pokemonCache.set(genId, generationPokemons);
        allPokemons = generationPokemons;
        currentDisplayedPokemons = generationPokemons;
        

        displayPokemons(generationPokemons);
        
    } catch (error) {
        console.error('Erro ao buscar Pokémons:', error);
        pokemonList.innerHTML = '<div class="loading">Erro ao carregar Pokémons. Tente novamente.</div>';
    } finally {
        isLoading = false;
    }
}


async function fetchPokemonData(id) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await response.json();
    return data;
}


function displayPokemons(pokemons) {

    pokemonList.classList.add('fade-out');
    
    setTimeout(() => {
        pokemonList.innerHTML = '';
        
        if (pokemons.length === 0) {
            pokemonList.innerHTML = '<div class="loading">Nenhum Pokémon encontrado.</div>';
            return;
        }
        
        pokemons.forEach(pokemon => {
            const card = createPokemonCard(pokemon);
            pokemonList.appendChild(card);
        });
        

        setTimeout(() => {
            pokemonList.classList.remove('fade-out');
        }, 50);
        
    }, 300);
}


function createPokemonCard(pokemon) {
    const card = document.createElement('div');
    card.className = 'pokemon-card';
    

    const types = pokemon.types.map(typeInfo => 
        `<span class="type-badge type-${typeInfo.type.name}">${typeInfo.type.name}</span>`
    ).join('');
    
    card.innerHTML = `
        <img src="${pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}" 
             alt="${pokemon.name}" 
             onerror="this.src='https://via.placeholder.com/120x120/ccc/fff?text=?'">
        <div class="pokemon-id">#${pokemon.id.toString().padStart(3, '0')}</div>
        <div class="pokemon-name">${capitalizeFirstLetter(pokemon.name)}</div>
        <div class="pokemon-types">${types}</div>
    `;
    
    card.addEventListener('click', () => {
        showPokemonDetails(pokemon);
    });
    
    return card;
}


async function globalSearch(searchTerm) {
    if (!searchTerm.trim()) {

        isSearching = false;
        const currentGenPokemons = pokemonCache.get(currentGeneration) || [];
        currentDisplayedPokemons = currentGenPokemons;
        displayPokemons(currentGenPokemons);
        generationInfo.textContent = `${generations.find(g => g.id === currentGeneration).name} - Pokémons ${generations.find(g => g.id === currentGeneration).start} a ${generations.find(g => g.id === currentGeneration).end}`;
        return;
    }

    isSearching = true;
    

    pokemonList.classList.add('fade-out');
    setTimeout(() => {
        pokemonList.innerHTML = '<div class="loading">Buscando em todas as gerações...</div>';
        pokemonList.classList.remove('fade-out');
    }, 300);

    try {
        let allPokemonsFromAllGens = [];
        

        for (let [genId, pokemons] of pokemonCache) {
            allPokemonsFromAllGens.push(...pokemons);
        }
        

        if (allPokemonsFromAllGens.length < 1025) {
            const missingGens = generations.filter(gen => !pokemonCache.has(gen.id));
            
            for (const gen of missingGens) {
                const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${gen.end - gen.start + 1}&offset=${gen.start - 1}`);
                const data = await response.json();
                
                const detailedPromises = data.results.map(pokemon => 
                    fetch(pokemon.url).then(res => res.json())
                );
                
                const detailedResults = await Promise.allSettled(detailedPromises);
                const genPokemons = detailedResults
                    .filter(result => result.status === 'fulfilled')
                    .map(result => result.value);
                
                pokemonCache.set(gen.id, genPokemons);
                allPokemonsFromAllGens.push(...genPokemons);
            }
        }
        

        const filtered = allPokemonsFromAllGens.filter(pokemon => 
            pokemon.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            pokemon.id.toString().includes(searchTerm)
        );
        
        currentDisplayedPokemons = filtered;
        

        if (filtered.length > 0) {
            generationInfo.textContent = `Busca: "${searchTerm}" - ${filtered.length} Pokémon(s) encontrado(s) em todas as gerações`;
        } else {
            generationInfo.textContent = `Busca: "${searchTerm}" - Nenhum Pokémon encontrado`;
        }
        
        displayPokemons(filtered);
        
    } catch (error) {
        console.error('Erro na busca global:', error);
        pokemonList.innerHTML = '<div class="loading">Erro na busca. Tente novamente.</div>';
    }
}


function setupSearch() {
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        
        const searchTerm = e.target.value.trim();
        
        if (searchTerm === '') {

            isSearching = false;
            const currentGenPokemons = pokemonCache.get(currentGeneration) || [];
            currentDisplayedPokemons = currentGenPokemons;
            displayPokemons(currentGenPokemons);
            
            const generation = generations.find(g => g.id === currentGeneration);
            generationInfo.textContent = `${generation.name} - Pokémons ${generation.start} a ${generation.end}`;
            return;
        }
        

        searchTimeout = setTimeout(() => {
            globalSearch(searchTerm);
        }, 300);
    });
}


function showPokemonDetails(pokemon) {
   let modal = document.getElementById('pokemonModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'pokemonModal';
        modal.className = 'pokemon-modal';
        document.body.appendChild(modal);
    }
    

    const types = pokemon.types.map(typeInfo => 
        `<span class="type-badge type-${typeInfo.type.name}">${typeInfo.type.name}</span>`
    ).join('');
    
    const stats = pokemon.stats.map(stat => `
        <div class="stat-row">
            <span class="stat-name">${capitalizeFirstLetter(stat.stat.name)}</span>
            <div class="stat-bar-container">
                <div class="stat-bar" style="width: ${Math.min(stat.base_stat, 150) / 150 * 100}%"></div>
            </div>
            <span class="stat-value">${stat.base_stat}</span>
        </div>
    `).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close">&times;</button>
            <div class="modal-header">
                <img class="modal-pokemon-image" 
                     src="${pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}" 
                     alt="${pokemon.name}"
                     onerror="this.src='https://via.placeholder.com/150x150/ccc/fff?text=?'">
                <div class="modal-pokemon-name">${capitalizeFirstLetter(pokemon.name)}</div>
                <div class="modal-pokemon-id">#${pokemon.id.toString().padStart(3, '0')}</div>
                <div class="modal-types">${types}</div>
            </div>
            <div class="modal-body">
                <div class="modal-stats">
                    <h3>Estatísticas Base</h3>
                    ${stats}
                </div>
            </div>
        </div>
    `;
    

    modal.classList.add('active');
    

    const closeButton = modal.querySelector('.modal-close');
    closeButton.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}


function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
