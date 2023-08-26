#!/usr/bin/env node
import {readFileSync, writeFileSync} from 'node:fs';
import {parseArgs} from 'node:util';

const {data: features} = JSON.parse(readFileSync('caniuse/data.json', 'utf8'));
const keystoneReleaseDates = JSON.parse(readFileSync('keystone-release-dates.json', 'utf8'));
const historicalFeatureData = JSON.parse(readFileSync('historical-feature-data.json', 'utf8'));

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

const keystoneFeatures = Object.keys(keystoneReleaseDates);

function dateString(timestamp) {
    return new Date(timestamp * 1000).toISOString().replace(/T.*/, '');
}

const results = Object.fromEntries(keystoneFeatures.map(feature => [feature, {
    keystone: keystoneReleaseDates[feature],
    marketshare: Number(features[feature].usage_perc_y),
    reached: {},
}]));

for (const targetMarketShare of targetMarketShares) {
    for (const feature of keystoneFeatures) {
        if (results[feature].marketshare < targetMarketShare) {
            results[feature].reached[targetMarketShare] = null;
        } else {
            const history = historicalFeatureData[feature];
            const { timestamp } = history.find(({ usage_perc_y }) => Number(usage_perc_y) >= targetMarketShare);
            results[feature].reached[targetMarketShare] = dateString(timestamp);
        }
    }
}

writeFileSync('target-dates.json', JSON.stringify(results, null, 2), 'utf8');

const ONE_DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

const today = dateString(Date.now() / 1000);

function daysDiff(start, end) {
    if (!end) return 'n/a';
    const diff = (new Date(end).getTime() - new Date(start).getTime()) / ONE_DAY_IN_MILLISECONDS;
    if (diff < 0) return 0;
    return diff;
}

const csv = `feature,marketshare,keystone,days since keystone,${targetMarketShares.map(target => `reached ${target}%,days to ${target}%`).join(',')
    }
${Object.entries(results).map(([feature, { keystone, reached }]) => {
        const marketshare = features[feature].usage_perc_y;
        const row = `${feature},${marketshare},${keystone},${daysDiff(keystone, today)},${Object.values(reached).map(reached => 
        `${reached ?? 'not yet'},${daysDiff(keystone, reached)}`
    ).join(',')}`;
    return row;
}).join('\n')}`;

writeFileSync('survival-input-data.csv', csv, 'utf8');