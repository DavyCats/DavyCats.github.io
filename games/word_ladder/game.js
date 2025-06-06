var score = 0;
var current_answer;
var loading = true;

function nextWord(){
    const mode = score % 5 == 0 ? "longer" : "same";

    let previous = "";
    if (current_answer) {
        previous = `&previous=${current_answer}`;
    }

    let guess_field = document.getElementById("guess");
    guess_field.placeholder = "Loading next clue...";
    loading = true;

    fetch(`https://crossword-clues.vercel.app/random?distance=1&distance_mode=${mode}&length=4${previous}`)
        .then(response =>  response.json())
        .then(result => {
            console.log(result)
            if (result.answer === "") {
                //FIXME
                alert("End of the line...")
            } else {
                addWord(result.answer, result.clue);
                guess_field.placeholder = "What could it be?";
                loading = false;
            }
        })
}

function addWord(answer, clue){
    let table = document.getElementById("words");
    let new_row = document.createElement("tr");
    let clue_cell = document.createElement("td");
    let answer_cell = document.createElement("td");

    current_answer = answer;
    answer_cell.id = "last";
    clue_cell.innerText = clue;
    answer_cell.innerText = `${".".repeat(current_answer.length)} (${current_answer.length})`
    new_row.appendChild(clue_cell);
    new_row.appendChild(answer_cell);
    table.appendChild(new_row);
}

function guess(){
    let value = document.getElementById("guess").value.toUpperCase();
    if (loading) {
        document.getElementById("guess").value = null;
    } else if (current_answer === value) {
        document.getElementById("last").innerText = current_answer;
        document.getElementById("guess").value = null;
        document.getElementById("last").id = null;
        score++;
        document.getElementById("score").innerText = score;
        nextWord();
    }
}

nextWord();