// Telegram bonus is checked only on the server. Bot tokens must never appear
// in browser JavaScript or Git history.
async function processWelcomeBonus() {
    if (!window.APP_CONFIG.telegramBonusesEnabled) return false;
    const result = await gameApi('claim_welcome_bonus');
    if (result?.player && Number.isFinite(Number(result.player.srum))) {
        srum = Number(result.player.srum);
        updateUI();
        return Boolean(result.claimed);
    }
    return false;
}
