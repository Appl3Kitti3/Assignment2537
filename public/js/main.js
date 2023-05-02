let luckyNummy = Math.floor(Math.random() * 5) + 1;

const imgTag = document.getElementById("image_holder");
switch (luckyNummy) {
    case 1: imgTag.src = "/img/boykisser.jpg";
    break;
    case 2: imgTag.src = "/img/cuteFleurSketch.jpg";
        break;
    case 3: imgTag.src = "/img/iconicfluff.jpg";
        break;
    case 4: imgTag.src = "/img/peace.png";
        break;
    case 5: imgTag.src = "/img/sleepingGamer.jpg";
        break;
}