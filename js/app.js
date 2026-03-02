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

let ghostData = null; // JSONから読み込んだゴーストデータを格納する変数
let evidenceState = {}; // 各証拠の選択状態（"none" / "yes" / "no"）を管理するオブジェクト

// JSONファイルを非同期で読み込む
fetch("data/ghosts.json")
    .then(res => res.json()) // レスポンスをJSONとして解析
    .then(data => {
        ghostData = data;
        // 全証拠の初期状態を"none"（未選択）に設定
        ghostData.evidences.forEach(ev => {
            evidenceState[ev] = "none";
        });
        renderEvidenceList(); // 証拠のラジオボタンを生成
        renderGhostList();    // 候補ゴーストを表示
    });

// 証拠ごとにラジオボタン（未選択・あり・なし）を生成してDOMに追加する
function renderEvidenceList() {
    const container = document.getElementById("evidence-list");
    container.innerHTML = ""; // 既存の内容をクリア

    ghostData.evidences.forEach(ev => {
        // 証拠1行分のコンテナ
        const row = document.createElement("div");
        row.className = "evidence-row";

        // 証拠名のラベル
        const labelName = document.createElement("span");
        labelName.textContent = evidenceLabels[ev];
        row.appendChild(labelName);

        // ラジオボタンのグループ
        const radioGroup = document.createElement("div");
        radioGroup.className = "radio-group";

        // "none" / "yes" / "no" の3状態分ラジオボタンを生成
        ["none", "yes", "no"].forEach(state => {
            const label = document.createElement("label");
            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = ev;       // 同じnameでグループ化（1つだけ選択可能になる）
            radio.value = state;
            radio.checked = state === "none"; // 初期値は"none"

            // ラジオボタンが変更されたときに状態を更新して再描画
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

// ゴーストを除外すべきかどうかを判定する関数
// trueを返すと除外、falseを返すと候補に残る
function isGhostExcluded(ghost, difficulty) {
    // "あり"の証拠リストと"なし"の証拠リストを作成
    const yesEvidences = ghostData.evidences.filter(ev => evidenceState[ev] === "yes");
    const noEvidences = ghostData.evidences.filter(ev => evidenceState[ev] === "no");

    // ルール1: "あり"にした証拠を持たないゴーストは除外
    for (const ev of yesEvidences) {
        if (!ghost.evidences.includes(ev)) return true;
    }

    // ルール2: "なし"にした証拠を持つゴーストは除外
    for (const ev of noEvidences) {
        if (ghost.evidences.includes(ev)) return true;
    }

    // ルール3・4: forcedEvidence（難易度に関わらず必ず出る証拠）のチェック
    if (ghost.forcedEvidence) {
        // forcedEvidenceを"なし"にしたら除外
        if (evidenceState[ghost.forcedEvidence] === "no") return true;

        // 難易度分の"あり"が埋まっているのにforcedEvidenceが含まれていなければ除外
        // 例: 難易度2でforcedEvidence以外の証拠が2つ"あり"になった場合
        if (yesEvidences.length >= difficulty && !yesEvidences.includes(ghost.forcedEvidence)) {
            return true;
        }
    }

    return false; // 除外条件に当てはまらなければ候補に残す
}

// 絞り込まれた候補ゴーストをカード形式でDOMに描画する
function renderGhostList() {
    const difficulty = parseInt(document.getElementById("difficulty-select").value);
    const container = document.getElementById("ghost-list");
    container.innerHTML = ""; // 既存の内容をクリア

    // isGhostExcludedがfalseのゴーストだけ残す
    const filtered = ghostData.ghosts.filter(ghost => !isGhostExcluded(ghost, difficulty));

    // 候補が0件の場合はメッセージを表示して終了
    if (filtered.length === 0) {
        container.textContent = "該当するゴーストがありません";
        return;
    }

    // 候補ゴーストをカードとして描画
    filtered.forEach(ghost => {
        const card = document.createElement("div");
        card.className = "ghost-card";

        // ゴースト名
        const name = document.createElement("h3");
        name.textContent = ghost.name;

        // 証拠リスト（"あり"の証拠はハイライト表示）
        const evidencesList = document.createElement("p");
        ghost.evidences.forEach((ev, index) => {
            const span = document.createElement("span");
            span.textContent = evidenceLabels[ev];
            if (evidenceState[ev] === "yes") {
                span.className = "evidence-highlight"; // ハイライト用クラスを付与
            }
            evidencesList.appendChild(span);
            // 最後の要素以外は読点で区切る
            if (index < ghost.evidences.length - 1) {
                evidencesList.appendChild(document.createTextNode("、"));
            }
        });

        // 特徴リスト
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

// 難易度セレクトボックスが変更されたときに候補ゴーストを再描画
document.getElementById("difficulty-select").addEventListener("change", renderGhostList);

// リセットボタンが押されたとき全証拠を未選択に戻す
document.getElementById("reset-button").addEventListener("click", () => {
    ghostData.evidences.forEach(ev => {
        evidenceState[ev] = "none";
        // ラジオボタンのUIも"none"に戻す
        const radios = document.querySelectorAll(`input[name="${ev}"]`);
        radios.forEach(radio => {
            radio.checked = radio.value === "none";
        });
    });
    renderGhostList(); // 候補ゴーストを再描画
});