(function (root, factory) {
    const economy = factory();
    if (typeof module === 'object' && module.exports) module.exports = economy;
    if (root) root.BorschEconomy = Object.freeze(economy);
})(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';

    const penaltyRates = Object.freeze([0.10, 0.20, 0.40, 0.80, 1.00]);
    const winnerShare = 0.70;
    const treasuryShare = 0.30;

    function normalizeStage(stage) {
        return Math.max(1, Math.min(5, Math.trunc(Number(stage) || 1)));
    }

    function roundSrum(value) {
        return Math.round((Number(value) + Number.EPSILON) * 10000) / 10000;
    }

    function calculateLoss(stake, stage) {
        const safeStake = Math.max(0, Number(stake) || 0);
        const safeStage = normalizeStage(stage);
        const penalty = roundSrum(safeStake * penaltyRates[safeStage - 1]);
        const winnerPayout = roundSrum(penalty * winnerShare);
        const treasury = roundSrum(penalty - winnerPayout);
        const remainingStake = roundSrum(Math.max(0, safeStake - penalty));
        return { stage: safeStage, penalty, winnerPayout, treasury, remainingStake };
    }

    function nextStage(stage, won) {
        return won ? Math.min(5, normalizeStage(stage) + 1) : 1;
    }

    return { penaltyRates, winnerShare, treasuryShare, calculateLoss, nextStage };
});
