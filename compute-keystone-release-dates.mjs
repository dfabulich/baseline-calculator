#!/usr/bin/env node
import {readFileSync, writeFileSync} from 'node:fs'

const {agents, data: features} = JSON.parse(readFileSync('caniuse/fulldata-json/data-2.0.json', 'utf8'));

const majorBrowsers = [
    'chrome',
    'safari',
    'edge',
    'firefox',
    'and_chr',
    'ios_saf',
    'samsung',
]

const browserVersions = {};

for (const browser of majorBrowsers) {
    browserVersions[browser] = Object.fromEntries(agents[browser].version_list.map(v => [v.version, v]));
}

//console.log({latestVersions});

function featureSupportedByAllMajorBrowsers(featureData) {
    for (const browser of majorBrowsers) {
        const currentVersion = agents[browser].current_version;
        if (featureData.stats[browser][currentVersion] !== "y") {
            return false;
        }
    }
    return true;
}

const keystoneReleaseDates = {};

for (const id in features) {
    if (!featureSupportedByAllMajorBrowsers(features[id])) continue;
    const browserReleaseDates = majorBrowsers
        .filter(browser => browser !== 'and_chr') // caniuse only includes data for latest and_chr
        .map(browser => {
            const [{version, releaseDate}] = Object.entries(features[id].stats[browser])
                .filter(entry => entry[1] === 'y')
                .filter(([version]) => browserVersions[browser][version].release_date)
                .map(([version]) => {
                    const releaseDate = agents[browser].version_list.find(v => v.version === version).release_date;
                    const dateString = new Date(releaseDate * 1000).toISOString().slice(0, 10);
                    
                    //console.log('    ', id, browser, version, dateString);
                    return {version, releaseDate: dateString};
                })
                .sort((a,b) => a.releaseDate.localeCompare(b.releaseDate));
            console.log('  ', id, browser, version, releaseDate);
            return {browser, version, releaseDate};
        });
    const {browser, version, releaseDate} = browserReleaseDates.sort((a,b) => a.releaseDate.localeCompare(b.releaseDate)).at(-1);
    if (agents[browser].version_list[0].version === version) {
        // this is the first recorded version for this browser, so we don't know the true keystone date
        console.log('SKIPPING', id, browser, version, releaseDate);
    } else {
        console.log(id, browser, version, releaseDate);
        keystoneReleaseDates[id] = releaseDate;
    }
}

writeFileSync('keystone-release-dates.json', JSON.stringify(keystoneReleaseDates, null, 2), 'utf8');
