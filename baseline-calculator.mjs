#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {parseArgs} from 'node:util';

let { values: {cohort} } = parseArgs({
    options: {
        cohort: { type: 'string' }
    }
})

const {data: features} = JSON.parse(readFileSync('caniuse/data.json', 'utf8'));
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

function median(values) {
    // https://stackoverflow.com/a/45309555/54829
    if (values.length === 0) throw new Error("No inputs");

    values.sort(function (a, b) {
        return a - b;
    });

    var half = Math.floor(values.length / 2);

    if (values.length % 2)
        return values[half];

    return (values[half - 1] + values[half]) / 2.0;
}

function average(values) {
    return values.reduce((prev, current) => prev + current, 0) / values.length;
}

// https://stackoverflow.com/a/53577159/54829
function stdev(array) {
    const n = array.length;
    const mean = average(array);
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}

function quantile(values, q) {
    const sorted = [...values].sort((a,b) => a-b);
    const index = Math.floor(sorted.length * q);
    return sorted[index];
}

function caniuseLink(featureId) {
    return `[${featureId}](https://caniuse.com/${featureId})`
}

const keystoneFeatures = Object.keys(keystoneReleaseDates).filter(feature => {
    if (!cohort) return true;
    return keystoneReleaseDates[feature].startsWith(cohort);
})

const results = Object.fromEntries(targetMarketShares.map(targetMarketShare => {
    const daysToTarget = keystoneFeatures.filter(feature =>
        Number(features[feature].usage_perc_y) >= targetMarketShare
    ).map(feature => {
        const history = historicalFeatureData[feature];
        const { timestamp } = history.find(({ usage_perc_y }) => Number(usage_perc_y) >= targetMarketShare);
        const keystoneReleaseTimestamp = new Date(keystoneReleaseDates[feature]).getTime() / 1000;
        let daysToTarget = Math.ceil((timestamp - keystoneReleaseTimestamp) / ONE_DAY_IN_SECONDS);
        if (daysToTarget < 0) daysToTarget = 0;
        return {feature, daysToTarget};
    }).sort((a, b) => a.daysToTarget - b.daysToTarget);
    debugger;
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