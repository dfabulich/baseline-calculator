#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {parseArgs} from 'node:util';

let { values: {percentile: targetConversion} } = parseArgs({
    options: {
        percentile: { type: 'string', 'default': '99'},
    }
})

const targetDates = JSON.parse(readFileSync('target-dates.json'));

const targetMarketShares = [
    80,
    85,
    90,
    91,
    92,
    93,
    94,
    95,
    96,
    97,
];

const ONE_DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

function daysDiff(start, end) {
    if (!end) return 'n/a';
    const diff = Math.ceil(
        (new Date(end).getTime() - new Date(start).getTime()) / ONE_DAY_IN_MILLISECONDS
    );
    if (diff < 0) return 0;
    return diff;
}

const cohorts = [...new Set(Object.values(targetDates).map(({keystone}) => keystone.replace(/-.*/, '')))];

const results = Object.fromEntries(cohorts.map(cohort => {
    const keystoneFeatures = Object.keys(targetDates).filter(feature => {
        if (!cohort) return true;
        return targetDates[feature].keystone.startsWith(cohort);
    })
    const result = [cohort, targetMarketShares.map((targetMarketShare) => {
        const daysToTarget = keystoneFeatures.filter(feature => {
            if (!targetDates[feature]) throw new Error(`couldn't find ${feature} in targetDates`);
            return targetDates[feature].marketshare > targetMarketShare
        }).map(feature => {
            const targetDate = targetDates[feature].reached[targetMarketShare];
            const daysToTarget = daysDiff(targetDates[feature].keystone, targetDate);
            return { feature, daysToTarget };
        }).sort((a, b) => a.daysToTarget - b.daysToTarget);
        if ((daysToTarget.length / keystoneFeatures.length) < (targetConversion / 100)) return "not yet";
        const index = Math.ceil(keystoneFeatures.length * (targetConversion / 100)) - 1;
        return Math.round(daysToTarget[index].daysToTarget / 30) + " months";
    })];
    return result;
}));

console.log(["Market Share", ...targetMarketShares.map(num => `${num}% share`)].join('|'))
console.log(Array(targetMarketShares.length+1).fill('---').join('|'));
for (const [cohort, daysToTarget] of Object.entries(results)) {
    console.log([cohort, ...daysToTarget].join('|'));
}