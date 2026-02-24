const evidenceLabels = {
    "EMF5": "EMF レベル5",
    "SpiritBox": "スピリットボックス",
    "Ultraviolet": "紫外線",
    "GhostOrb": "ゴーストオーブ",
    "GhostWriting": "ゴーストライティング",
    "FreezingTemps": "氷点下の気温",
    "DOTSProjector": "D.O.T.S プロジェクター"
};

let ghostData = null;
let evidenceState = {};

fetch("data/ghosts.json")
    .then(res => res.json())
    .then(data => {
        ghostData = data;
        ghostData.evidences.forEach(ev => {
            evidenceState[ev] = "none";
        });
        renderEvidenceList();
        renderGhostList();
    });

function renderEvidenceList() {
    const container = document.getElementById("evidence-list");
    container.innerHTML = "";

    ghostData.evidences.forEach(ev => {
        const row = document.createElement("div");
        row.className = "evidence-row";

        const labelName = document.createElement("span");
        labelName.textContent = evidenceLabels[ev];
        row.appendChild(labelName);

        const radioGroup = document.createElement("div");
        radioGroup.className = "radio-group";

        ["none", "yes", "no"].forEach(state => {
            const label = document.createElement("label");
            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = ev;
            radio.value = state;
            radio.checked = state === "none";
            radio.addEventListener("change", () => {
                evidenceState[ev] = state;
                renderGhostList();
            });
            label.appendChild(radio);
            label.appendChild(document.createTextNode(
                state === "none" ? "未選択" : state === "yes" ? "あり" : "なし"
            ));
            radioGroup.appendChild(label);
        });

        row.appendChild(radioGroup);
        container.appendChild(row);
    });
}

function isGhostExcluded(ghost, difficulty) {
    const yesEvidences = ghostData.evidences.filter(ev => evidenceState[ev] === "yes");
    const noEvidences = ghostData.evidences.filter(ev => evidenceState[ev] === "no");

    // ルール1: "あり"の証拠を持たないゴーストを除外
    for (const ev of yesEvidences) {
        if (!ghost.evidences.includes(ev)) return true;
    }

    // ルール2: "なし"の証拠を持つゴーストを除外
    for (const ev of noEvidences) {
        if (ghost.evidences.includes(ev)) return true;
    }

    // ルール3: forcedEvidenceを"なし"にしたら除外
    if (ghost.forcedEvidence) {
        if (evidenceState[ghost.forcedEvidence] === "no") return true;

        // ルール4: 難易度分の"あり"が埋まっているのにforcedEvidenceが含まれていなければ除外
        if (yesEvidences.length >= difficulty && !yesEvidences.includes(ghost.forcedEvidence)) {
            return true;
        }
    }

    return false;
}

function renderGhostList() {
    const difficulty = parseInt(document.getElementById("difficulty-select").value);
    const container = document.getElementById("ghost-list");
    container.innerHTML = "";

    const filtered = ghostData.ghosts.filter(ghost => !isGhostExcluded(ghost, difficulty));

    if (filtered.length === 0) {
        container.textContent = "該当するゴーストがありません";
        return;
    }

    filtered.forEach(ghost => {
        const card = document.createElement("div");
        card.className = "ghost-card";

        const name = document.createElement("h3");
        name.textContent = ghost.name;

        const evidencesList = document.createElement("p");
        ghost.evidences.forEach((ev, index) => {
            const span = document.createElement("span");
            span.textContent = evidenceLabels[ev];
            if (evidenceState[ev] === "yes") {
                span.className = "evidence-highlight";
            }
            evidencesList.appendChild(span);
            if (index < ghost.evidences.length - 1) {
                evidencesList.appendChild(document.createTextNode("、"));
            }
        });

        const traits = document.createElement("ul");
        ghost.traits.forEach(t => {
            const li = document.createElement("li");
            li.textContent = t;
            traits.appendChild(li);
        });

        card.appendChild(name);
        card.appendChild(evidencesList);
        card.appendChild(traits);
        container.appendChild(card);
    });
}

document.getElementById("difficulty-select").addEventListener("change", renderGhostList);

document.getElementById("reset-button").addEventListener("click", () => {
    ghostData.evidences.forEach(ev => {
        evidenceState[ev] = "none";
        const radios = document.querySelectorAll(`input[name="${ev}"]`);
        radios.forEach(radio => {
            radio.checked = radio.value === "none";
        });
    });
    renderGhostList();
});