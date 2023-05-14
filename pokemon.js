var pokemon = [];

const numPerPage = 10;
var numPages = 0;
const numPageBtn = 5;
const setup = async () => {
    console.log("Setup is setup");
    // axios handles the jquery json ajax calls
    // so axios is better
    let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
    console.log(response.data.results);

    pokemon = response.data.results;
    numPages = Math.ceil(pokemon.length / numPerPage);
    console.log("number of pokemons per page: ", numPages);

    showPage(1);

    // modal
    $('body').on('click', '.pokiCard', async function(e) {
        console.log(this);
        const pokemonName = $(this).attr('pokeName');
        console.log("The name: ", pokemonName);
        const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        console.log(res.data);
        const types = res.data.types.map((type) => type.type.name);
        console.log("types", types);

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
        const pageNum = parseInt($(this).attr('pageNum'));
        console.log("pageNum", pageNum);
        showPage(pageNum);
    })

}

async function showPage(currPage) {
    if (currPage < 1)
        currPage = 1;
    if (currPage > numPages)
        currPage = numPages;

    console.log("showPage ", currPage);
    console.log("start ", (currPage-1)*numPerPage);
    console.log("end ", ((currPage-1)*numPerPage) + numPerPage);
    console.log("poki length ", pokemon.length);
    console.log("showPage ", currPage);

    $('#title').empty().append(`Pokemon ~ Page ${currPage}`);
    $('#pokemon').empty(); // empty/delete the content (innerHTML)
    /*
        Experiment Error #1: If you do not put a closing tag for append, the jquery function would automatically
        close it and the other things that append it will not be inside that tag.
        COMP 2537 Week 3 2023 | 18:40 - 20:06
     */
    // let newList = $('<ol></ol>');
    for (let i = ((currPage-1)*numPerPage); i < (((currPage-1)*numPerPage) + numPerPage); i++) {
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

        // Appends this between the element tags.
        // newList.append(`<li>${pokemon[i].name}</li>`);
    }
    $('#pagination').empty().append(`
            <button type="button" class="btn btn-primary pageBtn" id="page1" pageNum="1" >1</button>
        `);
    let start = Math.max(1, currPage-Math.floor(numPageBtn/2));
    let end = Math.min(numPages, currPage+Math.floor(numPageBtn/2));
    const trueEnd = Math.ceil(pokemon.length/numPerPage);
    for (let i = start + 1; i <= end; i++) {
        if (i !== trueEnd)
        $('#pagination').append(`
            <button type="button" class="btn btn-primary pageBtn" id="page${i}" pageNum="${i}" >${i}</button>
        `)
    }

    $('#pagination').append(`
            <button type="button" class="btn btn-primary pageBtn" id="page${trueEnd}" pageNum="${trueEnd}" >${trueEnd}</button>
        `)
}
/*
    Once website is ready, call setup.
 */
$(document).ready(setup);