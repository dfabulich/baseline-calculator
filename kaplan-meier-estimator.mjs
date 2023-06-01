#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {parseArgs} from 'node:util';

let { values: {cohort} } = parseArgs({
    options: {
        cohort: { type: 'string' }
    }
})

const keystoneReleaseDates = JSON.parse(readFileSync('keystone-release-dates.json', 'utf8'));
const historicalFeatureData = JSON.parse(readFileSync('historical-feature-data.json', 'utf8'));

const targetMarketShares = [
    80,
    90,
    95,
    97,
    98,
    99,
];

const targetConversions = [
    50,
    75,
    80,
    90,
    95,
    97,
    98,
    99
]

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

/**
 * https://statsandr.com/blog/what-is-survival-analysis/
 * 
 * Reproduced the algorithm described by Antoine Soetewey in the article above.
 * 
 * In this algorithm, data points may be "censored."
 * Data points are censored if they "withdraw from the study," but also if the study ends before the patient dies.
 * This allows us to account for features launched in the last couple of years, estimating what would have happened.
 */

function computeKaplanMeierSurvivalFunction(survivalData) {
    const kaplanMeierTable = {};
    let remaining = survivalData.length;
    for (const { days, censored } of survivalData) {
        if (censored) {
            remaining--;
            continue;
        }
        if (!kaplanMeierTable[days]) {
            kaplanMeierTable[days] = { observations: 0, remaining };
        }
        kaplanMeierTable[days].observations++;
        remaining--;
    }

    const survivalFunction = { 0: 1 };
    let previous = 0;
    for (const [days, {observations, remaining}] of Object.entries(kaplanMeierTable)) {
        const dropoff = 1 - (observations / remaining);
        survivalFunction[days] = survivalFunction[previous] * dropoff;
        previous = days;
    }
    return survivalFunction;
}

const keystoneFeatures = Object.keys(keystoneReleaseDates).filter(feature => {
    if (!cohort) return true;
    return keystoneReleaseDates[feature].startsWith(cohort);
})

if (cohort) {
    console.log(`Cohort ${cohort}: ${keystoneFeatures.length} feature(s)\n`);
}

const now = Date.now() / 1000;

const results = Object.fromEntries(targetMarketShares.map(targetMarketShare => {
    const survivalData = keystoneFeatures.map(feature => {
        let censored = false;
        const history = historicalFeatureData[feature];
        let { timestamp } = history.find(({ usage_perc_y }) => (Number(usage_perc_y) >= targetMarketShare)) ?? { timestamp : null};
        if (!timestamp) {
            timestamp = now;
            censored = true;
        }
        const keystoneReleaseTimestamp = new Date(keystoneReleaseDates[feature]).getTime() / 1000;
        let days = Math.ceil((timestamp - keystoneReleaseTimestamp) / ONE_DAY_IN_SECONDS);
        if (days < 0) days = 1;
        return {feature, days, censored};
    }).sort((a,b) => a.days - b.days);
    
    const survivalFunction = computeKaplanMeierSurvivalFunction(survivalData);
    
    const result = [targetMarketShare, targetConversions.map(targetConversion => {
        const [daysToTarget] = Object.entries(survivalFunction).find(([days, survivalRate]) => 
            survivalRate < (1 - targetConversion/100)
        ) ?? [null];
        const result = daysToTarget ? Math.round(daysToTarget/ 30) + " months" : "never";
        return result;
    })]

    return result;
}));

console.log(["Market Share", ...targetConversions.map(num => `${num}% of features`)].join('|'))
console.log(Array(targetConversions.length+1).fill('---').join('|'));
for (const [targetMarketShare, daysToTarget] of Object.entries(results)) {
    console.log([`${targetMarketShare}% share`, ...daysToTarget].join('|'));
}