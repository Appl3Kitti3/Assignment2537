let luckyNummy = Math.floor(Math.random() * 5) + 1;

const imgTag = document.getElementById("image_holder");
switch (luckyNummy) {
    case 1: imgTag.style.backgroundImage = "url(/img/boykisser.jpg)";
    break;
    case 2: imgTag.style.backgroundImage = "url(/img/cuteFleurSketch.jpg)";
        break;
    case 3: imgTag.style.backgroundImage = "url(/img/iconicfluff.jpg)";
        break;
    case 4: imgTag.style.backgroundImage = "url(/img/peace.png)";
        break;
    case 5: imgTag.style.backgroundImage = "url(/img/sleepingGamer.jpg)";
        break;
}