#!/usr/bin/env node
import {readFileSync, writeFileSync} from 'node:fs';
import {computeDarkMatter} from './compute-dark-matter.mjs';

const {data: features, agents} = JSON.parse(readFileSync('caniuse/data.json', 'utf8'));
const keystoneReleaseDates = JSON.parse(readFileSync('keystone-release-dates.json', 'utf8'));
const historicalFeatureData = JSON.parse(readFileSync('historical-feature-data.json', 'utf8'));

const darkMatter = computeDarkMatter(agents);

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
    98,
    99
];

const keystoneFeatures = Object.keys(keystoneReleaseDates);

function dateString(timestamp) {
    return new Date(timestamp * 1000).toISOString().replace(/T.*/, '');
}

const results = Object.fromEntries(keystoneFeatures.map(feature => [feature, {
    keystone: keystoneReleaseDates[feature],
    marketshare: Number(features[feature].usage_perc_y) / darkMatter,
    reached: {},
}]));

for (const targetMarketShare of targetMarketShares) {
    for (const feature of keystoneFeatures) {
        if (results[feature].marketshare < targetMarketShare) {
            results[feature].reached[targetMarketShare] = null;
        } else {
            const history = historicalFeatureData[feature];
            const { timestamp } = history.find(({ trackedMarketShare }) => trackedMarketShare >= targetMarketShare);
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
        const marketshare = Math.round(features[feature].usage_perc_y / darkMatter * 100) / 100;
        const row = `${feature},${marketshare},${keystone},${daysDiff(keystone, today)},${Object.values(reached).map(reached => 
        `${reached ?? 'not yet'},${daysDiff(keystone, reached)}`
    ).join(',')}`;
    return row;
}).join('\n')}`;

writeFileSync('survival-input-data.csv', csv, 'utf8');