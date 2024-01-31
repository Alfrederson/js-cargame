// // Ignora as gambiarras. Isso é só pra conseguir rodar sem o leaderboard.

let meu_score = 0
export function getPlayerId(url, playerName) {
    return new Promise((resolve, _) => {
        resolve({
            playerName: playerName,
            playerId: 123456
        })
    })
}
/**
 * @param {string} bla
 * @param {string} blabla
 */
export function submitScore(bla, blabla, { gameId, score }) {
    meu_score = score
    return new Promise((resolve, reject) => resolve())
}
/**
 * @param {string} url
 * @param {string} gameId
 */
export function getLeaderboard(url, gameId) {
    return [
        { place: 1, player_name: "<b>Eteimoso</b>", total_score: "1000" },
        { place: 2, player_name: "El Gato", total_score: "1000" },
        { place: 3, player_name: "El Gato", total_score: "1000" },
        { place: 9999, player_name: "jogando local", total_score: meu_score.toString(), you: true },
    ]
}

console.log("usando leaderboard falso.")