// 証拠の表示名（英語キー→日本語表示の対応表）
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

    for (const ev of yesEvidences) {
        if (!ghost.evidences.includes(ev)) return true;
    }
    for (const ev of noEvidences) {
        if (ghost.evidences.includes(ev)) return true;
    }
    if (ghost.forcedEvidence) {
        if (evidenceState[ghost.forcedEvidence] === "no") return true;
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

    const countEl = document.getElementById("ghost-count");
    if (countEl) countEl.textContent = `（${filtered.length} 体）`;

    if (filtered.length === 0) {
        container.textContent = "該当するゴーストがありません";
        return;
    }

    filtered.forEach(ghost => {
        const card = document.createElement("div");
        card.className = "ghost-card";

        // ── ゴースト名 ──
        const name = document.createElement("h3");
        name.textContent = ghost.name;

        // ── 証拠リスト ──
        const evidencesList = document.createElement("p");
        evidencesList.className = "ghost-evidences";
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

        // ── サニティ・速度バッジ ──
        const metaRow = document.createElement("div");
        metaRow.className = "ghost-meta";

        if (ghost.huntSanity !== undefined) {
            const sanityBadge = document.createElement("span");
            sanityBadge.className = "meta-badge sanity-badge";
            sanityBadge.innerHTML = `🧠 SAN値: <strong>${ghost.huntSanity}%</strong>`;
            metaRow.appendChild(sanityBadge);
        }

        if (ghost.speed) {
            const speedBadge = document.createElement("span");
            speedBadge.className = "meta-badge speed-badge";
            speedBadge.innerHTML = `🏃 速度: <strong>${ghost.speed}</strong>`;
            metaRow.appendChild(speedBadge);
        }

        // ── 特徴リスト（【特定】行は色分けバッジ付き） ──
        const traits = document.createElement("ul");
        traits.className = "ghost-traits";
        ghost.traits.forEach(t => {
            const li = document.createElement("li");
            if (t.startsWith("【特定】")) {
                li.className = "trait-identify";
                const badge = document.createElement("span");
                badge.className = "identify-badge";
                badge.textContent = "特定";
                li.appendChild(badge);
                li.appendChild(document.createTextNode(t.replace("【特定】", "")));
            } else {
                li.textContent = t;
            }
            traits.appendChild(li);
        });

        // ── 組み立て ──
        card.appendChild(name);
        card.appendChild(evidencesList);
        card.appendChild(metaRow);
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