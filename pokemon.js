let pokemon = [];
let showTypes = [];
const numPerPage = 10;
let numPages = 0;
const numPageBtn = 5;

/**
 * Called upon a change on the filter buttons.
 *
 * @param selectedTypes selectedFilters
 * @returns {Promise<*|*[]>} List of all Pokémon when there are no filters active. Otherwise, returns
 * list of Pokémon with the desired types.
 */
async function fetchAllPokemon(selectedTypes) {
    let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
    let tempPokes = response.data.results;
    if (selectedTypes.length === 0) {
        numPages = Math.ceil(tempPokes.length / numPerPage);
        return tempPokes;
    }

    let filteredPokes = [];
    for (let i = 0; i < tempPokes.length; i++) {
        let pokeRes = await axios.get(`${tempPokes[i].url}`);
        let tempTypeArray = pokeRes.data.types.map((item) => item.type.name);

         if (selectedTypes.every(item => tempTypeArray.includes(item))) {
            filteredPokes.push(tempPokes[i]);
        }
    }
    numPages = Math.ceil(filteredPokes.length / numPerPage);
    return filteredPokes;
}

/**
 * Called upon when the website is ready.
 *
 * @returns {Promise<void>} nothing.
 */
const setup = async () => {
    // axios handles the jquery json ajax calls
    // so axios is better

    // jquery elements:
    let filterElement = $('#typeBoxes');
    let bodyElement = $('body');

    const typesArray = (await axios.get('https://pokeapi.co/api/v2/type')).data.results.map((type) => type.name);
    pokemon = (await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810')).data.results;
    numPages = Math.ceil(pokemon.length / numPerPage);

    filterElement.empty();
    let filterDiv = $('<div class="text-center row row-cols-5"></div>');

    for (let i = 0; i < typesArray.length; i++) {
        if (i % 5 === 0) {
            filterElement.append(filterDiv);
            filterDiv = $('<div class="text-center row row-cols-5"></div>');
        }
        filterDiv.append(`
        <label id="hi" class="col filter-box">${typesArray[i]}
            <input type="checkbox" name="type" class="types" filter="${typesArray[i]}">
        </label>
        `);
    }

    filterElement.append(filterDiv);

    await showPage(1);

    bodyElement.on('change', '.types', async function(){
        if ($(this).is(':checked')) {
            showTypes.push($(this).attr('filter'));
            $(this).parent().css('color', '#6543ff');
        }
        else {
            $(this).parent().css('color', 'black');
            showTypes = showTypes.filter((item) => item !== $(this).attr('filter'));
        }

        pokemon = await fetchAllPokemon(showTypes);
        if (pokemon) {
            showPage(1);
        }
    });


    // modal
    bodyElement.on('click', '.pokiCard', async function() {
        const pokemonName = $(this).attr('pokeName');
        const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        const pokemonType = res.data.types.map((type) => type.type.name);

        $('.modal-body').html(`
            <div class="">
                <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${pokemonName}">
                <div class="card text-white bg-info mb-3">
                    <div class="card-header">
                        ${pokemonType.map((type) => `${type.toUpperCase()}`).join(' | ')}
                    </div>
                </div>
                <div class="card text-white bg-danger mb-3">
                    <div class="card-body">
                        <div class="card-header">ABILITIES</div>
                        <ul>${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}</ul>
                    </div>
                </div>
                <div class="card text-white bg-success mb-3">
                    <div class="card-body">
                        <div class="card-header">STATS</div>
                        <ul>${res.data.stats.map((stat) => `<li>${stat.stat.name.toUpperCase()}: ${stat.base_stat}</li>`).join('')}</ul>
                    </div>
                </div>
            </div>
        `)
        $('.modal-title').html(`${res.data.name.toUpperCase()}`);
    })

    // pagination
    bodyElement.on('click', '.pageBtn', async function() {
        let pageNum = parseInt($(this).attr('pageNum'));
        showPage(pageNum);
    })

}

async function showPage(currPage) {

    if (currPage > numPages)
        currPage = numPages;

    if (currPage < 1)
        currPage = 1;


    // jquery elements:
    let pokemonGroup = $('#pokemon');
    let pagination = $('#pagination');
    $('#header').empty().append(
        `<h1 id="title" currentPage="${currPage}">
        Pokemon ~ Page ${currPage}
        </h1>`
    );


    pokemonGroup.empty(); // empty/delete the content (innerHTML)
    pokemonGroup.append(`
        <div id="show">
            
        </div>
    `);
    /*
        note to self #1: If you do not put a closing tag for append, the jquery function would automatically
        close it and the other things that append it will not be inside that tag.
        COMP 2537 Week 3 2023 | 18:40 - 20:06
     */
    // let newList = $('<ol></ol>');
    let startII = Math.max(0, ((currPage-1)*numPerPage));
    let endII = Math.max(10, (((currPage-1)*numPerPage) + numPerPage));

    let displayQuantity = 0;
    for (let i = startII; i < endII; i++) {
        if (pokemon[i] == null)
            break;

        let currPokemon = (await axios.get(`${pokemon[i].url}`)).data;
        pokemonGroup.append(`
            <div class="pokiCard card text-center" pokeName=${currPokemon.name} style="width: 18rem;">
              <div class="card-body">
                <h5 class="card-title">${currPokemon.name.toUpperCase()}</h5>
              <img class="card-img-top" src="${currPokemon.sprites.front_default}" alt="${currPokemon.name}">
                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#pokeModal">More</button>
              </div>
            </div>
        `);
        displayQuantity++;

        // Appends this between the element tags.
        // newList.append(`<li>${pokemon[i].name}</li>`);
    }

    /* Displays how many Pokémon are in the current page over total amount of Pokémon. */
    $('#show').append(`
        <h1>Showing ${displayQuantity} of ${pokemon.length} Pokemons</h1>
    `)

    pagination.empty();

    let start = Math.max(1, currPage-Math.floor(numPageBtn/2));
    let end = Math.min(numPages, currPage+Math.floor(numPageBtn/2));

    if (currPage > 1) {
        pagination.append(`
            <button type="button" class="btn btn-primary pageBtn" id="pageFirst" pageNum="1">First</button>
        `)
        pagination.append(`
            <button type="button" class="btn btn-primary pageBtn" id="pageprev" pageNum="${currPage-1}" >Prev</button>
        `)
    }

    let active = "";
    for (let i = start; i <= end; i++) {
        active = "";
        if (i === currPage)
            active = "active";
        pagination.append(`
            <button type="button" class="btn btn-primary pageBtn ${active}" id="page${i}" pageNum="${i}" >${i}</button>
        `)
    }

    if (currPage === numPages)
        active = "active";
    if (currPage < numPages) {
        pagination.append(`
            <button type="button" class="btn btn-primary pageBtn" id="pageprev" pageNum="${currPage+1}" >Next</button>
        `)
        pagination.append(`
            <button type="button" class="btn btn-primary pageBtn ${active}" id="pagelast" pageNum="${numPages}" >Last</button>
        `)
    }

}

/*
    Once website is ready, call setup.
 */
$(document).ready(setup);