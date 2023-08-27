#!/usr/bin/env node
import {readFileSync, writeFileSync} from 'node:fs';
import {execSync} from 'node:child_process';
import {computeDarkMatter} from './compute-dark-matter.mjs';

const historicalFeatureData = {};

const output = execSync('git log --format=%h,%at -- data.json', { cwd: 'caniuse' , encoding: 'utf8'});

const revisions = Object.fromEntries(output.trim().split('\n').map(line => line.split(',')));

for (const revision in revisions) {
    const timestamp = revisions[revision];
    const dateString = new Date(timestamp * 1000).toISOString().slice(0, 10);
    console.log({revision, dateString});
    execSync(`git checkout ${revision} -- data.json`, {cwd: 'caniuse'});
    try {
        const { data: features, agents } = JSON.parse(readFileSync('caniuse/data.json', 'utf8'));
        const darkMatter = computeDarkMatter(agents);
        for (const feature in features) {
            const { usage_perc_y } = features[feature];
            const trackedMarketShare = usage_perc_y / darkMatter;
            if (!historicalFeatureData[feature]) historicalFeatureData[feature] = [];
            historicalFeatureData[feature].push({ timestamp, usage_perc_y, darkMatter, trackedMarketShare });
        }
    } catch (e) {
        console.log('skipping unparseable data', revision);
    }
}

for (const feature in historicalFeatureData) {
    historicalFeatureData[feature].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
}

writeFileSync('historical-feature-data.json', JSON.stringify(historicalFeatureData, null, 2), 'utf8');

execSync('git restore -WS data.json', {cwd: 'caniuse'});

console.log('done');