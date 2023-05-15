var pokemon = [];
var showTypes = [];
const numPerPage = 10;
var numPages = 0;
const numPageBtn = 5;
let iI = 0;

async function fetchPokemons(types) {
    let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
    let tempPokes = response.data.results;
    if (types.length == 0) {
        numPages = Math.ceil(tempPokes.length / numPerPage);
        return tempPokes;
    }

    let filteredPokes = [];
    for (let i = 0; i < tempPokes.length; i++) {
        let pokeRes = await axios.get(`${tempPokes[i].url}`);
        let currPoke = pokeRes.data;
        let tempTypeArray = currPoke.types.map((item) => item.type.name);

         if (types.every(item => tempTypeArray.includes(item))) {
            filteredPokes.push(tempPokes[i]);
        }
    }
    numPages = Math.ceil(filteredPokes.length / numPerPage);
    return filteredPokes;
}
const setup = async () => {
    // axios handles the jquery json ajax calls
    // so axios is better
    let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
    const allTypes = await axios.get('https://pokeapi.co/api/v2/type');
    console.log("Called once");
    const typesArray = allTypes.data.results.map((type) => type.name);
    pokemon = response.data.results;
    numPages = Math.ceil(pokemon.length / numPerPage);
    // console.log("number of pokemons per page: ", numPages);

    $('#typeBoxes').empty();
    let ulExample = $('<div class="text-center row row-cols-5"></div>');

    for (let i = 0; i < typesArray.length; i++) {
        if ((i) % 5 == 0) {
            $('#typeBoxes').append(ulExample);
            ulExample = $('<div class="text-center row row-cols-5"></div>');
        }
        ulExample.append(`
<!--        <li class="list-group-item col">-->
        <label id="hi" class="col filter-box">${typesArray[i]}
        <input type="checkbox" name="type" class="types" filter="${typesArray[i]}">
        </label>
<!--        </li>-->
        `);
    }
    $('#typeBoxes').append(ulExample);

    await showPage(1);

    $('body').on('change', '.types', async function(e){
        // console.log()
        if ($(this).is(':checked')) {
            showTypes.push($(this).attr('filter'));
            // $(this).style.color = "red";
            $(this).parent().css('color', '#6543ff');
        }
        else {
            $(this).parent().css('color', 'black');
            showTypes = showTypes.filter((item) => item !== $(this).attr('filter'));
        }

        pokemon = await fetchPokemons(showTypes);
        if (pokemon) {
            console.log(numPages);
            showPage(1);
        }
        // console.log($('#title').attr('currentPage'));
    });


    // modal
    $('body').on('click', '.pokiCard', async function(e) {
        // console.log(this);
        const pokemonName = $(this).attr('pokeName');
        // console.log("The name: ", pokemonName);
        const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        // console.log(res.data);
        const types = res.data.types.map((type) => type.type.name);
        // console.log("types hold on", types);

        $('.modal-body').html(`
            <div class="">
                <img src="${res.data.sprites.other['official-artwork'].front_default}">
                <div class="card text-white bg-info mb-3">
                    <div class="card-header">
                        ${types.map((type) => `${type.toUpperCase()}`).join(' | ')}
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
    $('body').on('click', '.pageBtn', async function(e) {
        let pageNum = parseInt($(this).attr('pageNum'));
        if (pageNum < 1)
            pageNum++
        await showPage(pageNum);
    })

}

async function showPage(currPage) {
    // console.log(currPage);
    if (currPage < 1) {
        currPage = 1;
    }
    if (currPage > numPages)
        currPage = numPages;

    if (currPage == 0)
        currPage = 1;
    $('#header').empty().append(
        `<h1 id="title" currentPage="${currPage}">
        Pokemon ~ Page ${currPage}
        </h1>`
    );


    $('#pokemon').empty(); // empty/delete the content (innerHTML)
    $('#pokemon').append(`
    <div id="show">
        
    </div>
`);
    /*
        Experiment Error #1: If you do not put a closing tag for append, the jquery function would automatically
        close it and the other things that append it will not be inside that tag.
        COMP 2537 Week 3 2023 | 18:40 - 20:06
     */
    // let newList = $('<ol></ol>');
    let startII = Math.max(0, ((currPage-1)*numPerPage));
    let endII = Math.max(10, (((currPage-1)*numPerPage) + numPerPage));
    // iI;
    let displayQuant = 0;
    for (let i = startII; i < endII; i++) {
        if (pokemon[i] == null) {
            // console.log(pokemon.length);
            break;
        }
        let innerResponse = await axios.get(`${pokemon[i].url}`);
        let currPokemon = innerResponse.data;
                $('#pokemon').append(`
                    <div class="pokiCard card text-center" pokeName=${currPokemon.name} style="width: 18rem;">
                      <div class="card-body">
                        <h5 class="card-title">${currPokemon.name.toUpperCase()}</h5>
                      <img class="card-img-top" src="${currPokemon.sprites.front_default}" alt="${currPokemon.name}">
                        <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#pokeModal">More</button>
                      </div>
                    </div>
                `);
                displayQuant++;
            // i++;
        // }

        // Appends this between the element tags.
        // newList.append(`<li>${pokemon[i].name}</li>`);
    }
    $('#show').append(`
        <h1>Showing ${displayQuant} of ${pokemon.length} Pokemons</h1>
    `)
    $('#pagination').empty();

    let start = Math.max(1, currPage-Math.floor(numPageBtn/2));
    let end = Math.min(numPages, currPage+Math.floor(numPageBtn/2));

    if (currPage > 1) {
        $('#pagination').append(`
            <button type="button" class="btn btn-primary pageBtn" id="pagefirst" pageNum="1">First</button>
        `)
        $('#pagination').append(`
            <button type="button" class="btn btn-primary pageBtn" id="pageprev" pageNum="${currPage-1}" >Prev</button>
        `)
    }
    let active = "";
    for (let i = start; i <= end; i++) {
        active = "";
        // if (i !== trueEnd)
        if (i == currPage)
            active = "active";
        $('#pagination').append(`
            <button type="button" class="btn btn-primary pageBtn ${active}" id="page${i}" pageNum="${i}" >${i}</button>
        `)
    }
    if (currPage == numPages)
        active = "active";
    if (currPage < numPages) {
        $('#pagination').append(`
            <button type="button" class="btn btn-primary pageBtn" id="pageprev" pageNum="${currPage+1}" >Next</button>
        `)
        $('#pagination').append(`
            <button type="button" class="btn btn-primary pageBtn ${active}" id="pagelast" pageNum="${numPages}" >Last</button>
        `)
    }

    // $('#pagination').append(`
    //         <button type="button" class="btn btn-primary pageBtn" id="page${trueEnd}" pageNum="${trueEnd}" >${trueEnd}</button>
    //     `)
}
/*
    Once website is ready, call setup.
 */
$(document).ready(setup);