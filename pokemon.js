let pokemon = [];           // Total list of Pokemon (Pokedex)
const maxAmount = 810; // amount of Pokemon
let difficulty = "Easy";
let numberPokes = 0;
let hasFlippedCard = false;
let firstCard, secondCard;
let lockBoard = false;
let cards;
let memoryGame = $('.memory-game');
const rng = 9;
let totalPairs = 0;
let userFound = 0;
let userClicks = 0;
let currTime = 0;

let memoryCard;
let x, y;

/*
    Get random pokemon!
 */
async function fetchPokemon(amount) {
    let pokes = [];
    for (let i = 0; i < (amount); i++) {
        let random = Math.floor(Math.random() * maxAmount);
        if (pokes.includes(pokemon[random]))
            i--;
        else
            pokes.push(pokemon[random]);
    }

    return pokes;
}

/*
    Generate a list of random Pokes and based on the difficulty, return the amount of pairs!
 */
async function displayDifficulty(id) {
    let amount = 0;
    switch (id) {
        case "Easy":
            amount = 6;
            break;
        case "Medium":
            amount = 10;
            break;
        case "Hard":
            amount = 16;
            break;
    }

    totalPairs = amount;
    numberPokes = amount * 2;
    let entities = await fetchPokemon(amount);

    memoryGame.empty();
    for (let k = 0; k <= 1; k++) {
        for (let i = 0; i < (entities.length); i++) {
            let currPoke = (await axios.get(`${entities[i].url}`)).data;
            memoryGame.append(`
            <div class="memory-card" data-pokemon="${currPoke.name}">
                    <img class="front-face" src="${currPoke.sprites.other['official-artwork'].front_default}" alt="front"/>
                    <img class="back-face" src="back.png" alt="backCard"/>
                </div>`);
        }
    }



}

/*
    Called when a card is flipped!
 */
function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    /* Power up! */
    let rngVal = Math.floor(Math.random() * 10);
    if (rngVal === rng) {
        powerUp();
        return;
    }

    userClicks++;
    this.classList.add('flipped');

    if (!hasFlippedCard) {
        // first clicked
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    // second clicked
    hasFlippedCard = false;
    secondCard = this;

    // check cards match
    checkForMatch();

}

/*
    Checks if both clicked cards are a match!
 */
function checkForMatch() {
    return (firstCard.dataset.pokemon === secondCard.dataset.pokemon) ? disableCards() : unflipCards();
}

/*
    Disable the found cards!
 */
function disableCards() {
    userFound++;
    firstCard.classList.add('found');
    secondCard.classList.add('found');
    firstCard.removeEventListener("click", flipCard);
    secondCard.removeEventListener("click", flipCard);
    resetBoard();
}

/*
    Put cards back in hiding!
 */
function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        firstCard.classList.remove("flipped");
        secondCard.classList.remove("flipped");
        resetBoard();
    }, 1500);
}

/*
    Return everything to the original state!
 */
function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];

}

/*
    Shuffle the cards!
 */
function shuffle() {
    cards.forEach(card => {
        let randomPos = Math.floor(Math.random() * numberPokes);
        card.style.order = randomPos;
    });
}


/*
    Assign difficulty!
 */
function assignDifficulty() {
    difficulty = this.innerText;
    $('#showDiff').empty().append(`
    Difficulty: ${difficulty}
    `);
}

/*
    Called when document is ready!
 */
const setup = async () => {

    /* Initially set it to something! */
    displayMode();

    pokemon = (await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810')).data.results;
    $('#showDiff').empty().append(`
    Difficulty: ${difficulty}
    `);
    let diffButtons = document.querySelectorAll(".diff");
    diffButtons.forEach(btn => btn.addEventListener("change", assignDifficulty));

    /* Light and Dark mode! */
    document.querySelectorAll(".viewMode").forEach(radio => radio.addEventListener("change", displayMode))

    /* Start and reset button! */
    document.getElementById("start").addEventListener('click', async function () {
        clearInterval(x);
        clearInterval(y);
        await displayDifficulty(difficulty);
        cards = document.querySelectorAll(".memory-card");
        userClicks = 0;
        userFound = 0;
        memoryCard = $('.memory-card');
        organize();
        getDisplay();
        shuffle();
        cards.forEach(card => card.addEventListener("click", flipCard));

    });

    document.getElementById("reset").addEventListener("click", function() {
        clearInterval(x);
        clearInterval(y);
        memoryGame.empty();
    })
}

/*
    Power Up message and functionality!
 */
function powerUp() {
    $('#powerUp').empty().append(`
    <strong>Power Up!</strong>
    `)
    cards.forEach(card => card.classList.add('flipped'));
    setTimeout(() => {
        cards.forEach(card => (card.classList.contains("found") ? null : card.classList.remove('flipped')));
        resetBoard();
        $('#powerUp').empty();
    }, 1500);
}

/*
    Organize the frontend interface based on the difficulty! Because the # of cards shown makes the interface look weird!
 */
function organize() {
    console.log(difficulty);
    switch (difficulty) {
        case "Easy":
            memoryCard.width("calc(25% - 10px)");
            memoryCard.height("calc(25% - 10px)");
            break;
        case "Medium":
            memoryCard.width("calc(20% - 10px)");
            memoryCard.height("calc(25% - 10px)");
            break;
        case "Hard":
            memoryCard.width("calc(12% - 10px)");
            memoryCard.height("calc(20% - 10px)");
            break;
    }

}

/*
    Based on the difficulty, get the time!
 */
function getNumeric() {
    switch (difficulty) {
        case "Easy":
            return 150;
        case "Medium":
            return 250;
        case "Hard":
            return 450;
    }
}

/*
    The information about the game's current state, like total pairs, # of clicks. etc!
 */
function getDisplay() {
    currTime = getNumeric();
    let info = $('#displayInfo').empty();
    x = setInterval(function () {
        if (currTime >= 0)
                currTime--;
        }, 1000);
    y = setInterval(function() {
        let cardsLeft = totalPairs - userFound;
        if (cardsLeft === 0) {
            win();
            clearInterval(x);
            clearInterval(y);
            lockBoard = true;
        }
        if (currTime <= 0) {
            clearInterval(x);
            clearInterval(y);
            lockBoard = true;
            alert("Time is Up!");
            memoryGame.empty();
            info.empty().append(`
                Total Pairs: ${totalPairs}</br>
                # of Matches: ${userFound}</br>
                # of Pairs left: ${cardsLeft}</br>
                # of Clicks: ${userClicks}</br>
            `);
        }
         else {
            info.empty().append(`
                Total Pairs: ${totalPairs}</br>
                # of Matches: ${userFound}</br>
                # of Pairs left: ${cardsLeft}</br>
                # of Clicks: ${userClicks}</br>
                You have until ${Math.floor(currTime / 60)}:${((currTime % 60) <= 10) ? "0" + (currTime % 60) : (currTime % 60)}
            `);
        }

    }, 1);

}

/*
    Light and Dark mode!
 */
function displayMode() {
    let mode = this.innerText;
    let body = $('body');
    if (mode === "Dark") {
        body.css("color", "white");
        body.css("background-color", "black");
    } else {
        body.css("color", "black");
        body.css("background-color", "wheat");
    }
}

/*
    Called when the pairs left is 0!
 */
function win() {
    memoryGame.empty();
    memoryGame.append("<h2>You Won Congratulations!</h2>");
}

/*
    Once website is ready, call setup.
 */
$(document).ready(setup());