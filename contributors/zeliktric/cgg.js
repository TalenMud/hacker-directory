const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let guessColour = "";
let userColour = "#000000";

let bestGuess = 0;
let bestGuessColour = "";

function randomHexColour()
{
    return "#" + Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, "0");
}

function fillCanvasColour()
{
    
    guessColour = randomHexColour();

    ctx.rect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.fillStyle = guessColour;
    ctx.fill();
}

function pickedColour(element)
{
    document.getElementById("colourHex").innerHTML = `Your Colour: ${element.value}`;
    userColour = element.value;
}

function hexToRgb(hex)
{
    hex = hex.replace("#", "");
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
    };
}

function colorSimilarity(hex1, hex2)
{
    const c1 = hexToRgb(hex1);
    const c2 = hexToRgb(hex2);

    const distance = Math.sqrt(
        (c1.r - c2.r) ** 2 +
        (c1.g - c2.g) ** 2 +
        (c1.b - c2.b) ** 2
    );

    const maxDistance = Math.sqrt(255 ** 2 * 3); // max possible distance
    const similarity = 100 - (distance / maxDistance) * 100;

    return Math.round(similarity * 100) / 100; // 2 decimal places
}

function submitButton(element)
{
    if (element.innerHTML == "Guess!")
    {
        var similarity = colorSimilarity(guessColour, userColour);
        document.getElementById("similarity").innerHTML = `Similarity: ${similarity}%`;

        if (similarity > bestGuess)
        {
            bestGuess = similarity;
            bestGuessColour = userColour;
            document.getElementById("bestGuess").innerHTML = `Best Guess: ${bestGuess}%`;
            document.getElementById("bestGuessUserColour").value = userColour;
            document.getElementById("bestGuessColour").value = guessColour;
        }

        element.innerHTML = "Next Colour!";
    }
    else
    {
        fillCanvasColour();
        document.getElementById("similarity").innerHTML = "Similarity:";
        document.getElementById("colourPicker").value = "#000000";
        document.getElementById("colourHex").innerHTML = "Your Colour: #000000";
        element.innerHTML = "Guess!";
    }
    
}

fillCanvasColour();