#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {parseArgs} from 'node:util';

let { values: {cohort} } = parseArgs({
    options: {
        cohort: { type: 'string' }
    }
})

const targetDates = JSON.parse(readFileSync('target-dates.json', 'utf8'));

const targetMarketShares = Object.keys(Object.values(targetDates)[0].reached);

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

const keystoneFeatures = Object.keys(targetDates).filter(feature => {
    if (!cohort) return true;
    return targetDates[feature].keystone.startsWith(cohort);
})

if (cohort) {
    console.log(`Cohort ${cohort}: ${keystoneFeatures.length} feature(s)\n`);
}

const today = new Date().toISOString().replace(/T.*/, '');

const ONE_DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

function daysDiff(start, end) {
    const diff = (new Date(end).getTime() - new Date(start).getTime()) / ONE_DAY_IN_MILLISECONDS;
    if (diff < 0) return 0;
    return diff;
}

const results = Object.fromEntries(targetMarketShares.map(targetMarketShare => {
    const survivalData = Object.entries(targetDates).filter(([,{keystone}]) => {
        if (!cohort) return true;
        return keystone.startsWith(cohort);
    }).map(([feature, {keystone, marketshare, reached}]) => {
        if (marketshare > targetMarketShare) {
            const days = daysDiff(keystone, reached[targetMarketShare]);
            return {feature, days, censored: false};
        } else {
            const days = daysDiff(keystone, today);
            return {feature, days, censored: true};
        }
    }).sort((a,b) => a.days - b.days);
    
    const survivalFunction = computeKaplanMeierSurvivalFunction(survivalData);
    
    const result = [targetMarketShare, targetConversions.map(targetConversion => {
        const [daysToTarget] = Object.entries(survivalFunction).find(([days, survivalRate]) => 
            survivalRate < (1 - targetConversion/100)
        ) ?? [null];
        const result = daysToTarget ? Math.round(daysToTarget/ 30) + " months" : "unknown";
        return result;
    })]

    return result;
}));

console.log(["Market Share", ...targetConversions.map(num => `${num}% of features`)].join('|'))
console.log(Array(targetConversions.length+1).fill('---').join('|'));
for (const [targetMarketShare, daysToTarget] of Object.entries(results)) {
    console.log([`${targetMarketShare}% share`, ...daysToTarget].join('|'));
}