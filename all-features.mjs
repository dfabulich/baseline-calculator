import {readFileSync} from 'node:fs';
import {computeDarkMatter} from './compute-dark-matter.mjs';
const {data, agents} = JSON.parse(readFileSync('caniuse/data.json', 'utf8'));

const darkMatter = computeDarkMatter(agents);

const results = [];

for (const feature in data) {
    const trackedMarketShare = Math.round(data[feature].usage_perc_y / darkMatter * 100) / 100;
    results.push({feature, trackedMarketShare});
}

results.sort(({trackedMarketShare: a}, {trackedMarketShare: b}) => b - a);

console.log('feature,marketshare,trackedMarketShare');
for (const {feature, trackedMarketShare} of results) {
    const marketshare = data[feature].usage_perc_y;
    console.log([feature, marketshare, trackedMarketShare].join(','));
}