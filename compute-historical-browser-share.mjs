#!/usr/bin/env node
import {readFileSync, writeFileSync} from 'node:fs';
import {execSync} from 'node:child_process';

const historicalBrowserData = {};

const output = execSync('git log --format=%h,%at -- data.json', { cwd: 'caniuse' , encoding: 'utf8'});

const revisions = Object.fromEntries(output.trim().split('\n').map(line => {
    const [revision, timestamp] = line.split(',');
    return [revision, Number.parseInt(timestamp)];
}));

for (const revision in revisions) {
    const timestamp = revisions[revision];
    const dateString = new Date(timestamp * 1000).toISOString().slice(0, 10);
    console.log({revision, dateString});
    execSync(`git checkout ${revision} -- data.json`, {cwd: 'caniuse'});
    try {
        const { agents } = JSON.parse(readFileSync('caniuse/data.json', 'utf8'));
        for (const agent in agents) {
            if (!agents[agent].usage_global) continue;
            if (!historicalBrowserData[agent]) historicalBrowserData[agent] = [];
            historicalBrowserData[agent].push({ timestamp, usage_global: agents[agent].usage_global });
        }
    } catch (e) {
        console.log('skipping unparseable data', revision);
    }
}

for (const agent in historicalBrowserData) {
    historicalBrowserData[agent].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
}

writeFileSync('historical-browser-data.json', JSON.stringify(historicalBrowserData, null, 2), 'utf8');

execSync('git restore -WS data.json', {cwd: 'caniuse'});

console.log('done');