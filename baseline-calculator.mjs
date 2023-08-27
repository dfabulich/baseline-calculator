#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {parseArgs} from 'node:util';

let { values: {cohort} } = parseArgs({
    options: {
        cohort: { type: 'string' }
    }
})

const targetDates = JSON.parse(readFileSync('target-dates.json'));

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

const ONE_DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

const keystoneFeatures = Object.keys(targetDates).filter(feature => {
    if (!cohort) return true;
    return targetDates[feature].keystone.startsWith(cohort);
})

if (cohort) {
    console.log(`Cohort ${cohort}: ${keystoneFeatures.length} feature(s): ${keystoneFeatures.join(', ')}\n`);
}

function daysDiff(start, end) {
    if (!end) return 'n/a';
    const diff = Math.ceil(
        (new Date(end).getTime() - new Date(start).getTime()) / ONE_DAY_IN_MILLISECONDS
    );
    if (diff < 0) return 0;
    return diff;
}

const results = Object.fromEntries(targetMarketShares.map(targetMarketShare => {
    const daysToTarget = keystoneFeatures.filter(feature => {
        if (!targetDates[feature]) throw new Error(`couldn't find ${feature} in targetDates`);
        return targetDates[feature].marketshare > targetMarketShare
    }).map(feature => {
        const targetDate = targetDates[feature].reached[targetMarketShare];
        const daysToTarget = daysDiff(targetDates[feature].keystone, targetDate);
        return {feature, daysToTarget};
    }).sort((a, b) => a.daysToTarget - b.daysToTarget);
    const result = [targetMarketShare, targetConversions.map(targetConversion => {
        if ((daysToTarget.length / keystoneFeatures.length) < (targetConversion/100)) return "never";
        const index = Math.ceil(keystoneFeatures.length * (targetConversion/100)) - 1;
        return Math.round(daysToTarget[index].daysToTarget / 30) + " months";
    })]

    return result;
}));

console.log(["Market Share", ...targetConversions.map(num => `${num}% of features`)].join('|'))
console.log(Array(targetConversions.length+1).fill('---').join('|'));
for (const [targetMarketShare, daysToTarget] of Object.entries(results)) {
    console.log([`${targetMarketShare}% share`, ...daysToTarget].join('|'));
}