#!/usr/bin/env node
import {readFileSync, writeFileSync} from 'node:fs'

const {agents, data: features} = JSON.parse(readFileSync('caniuse/data.json', 'utf8'));

const majorBrowsers = [
    'chrome',
    'safari',
    'edge',
    'firefox',
    'and_chr',
    'ios_saf',
]

const caniuseIdToBcdId = {
    'chrome': 'chrome',
    'safari': 'safari',
    'edge': 'edge',
    'firefox': 'firefox',
    'and_chr': 'chrome_android',
    'ios_saf': 'safari_ios',
}

const bcd = {};
for (const browser of majorBrowsers) {
    const bcdId = caniuseIdToBcdId[browser];
    const bcdFilePath = `browser-compat-data/browsers/${bcdId}.json`;
    const data = JSON.parse(readFileSync(bcdFilePath, 'utf8')).browsers[bcdId];
    bcd[browser] = data;
}

const latestVersions = {};
for (const browser of majorBrowsers) {
    const {releases} = bcd[browser];
    const [latestVersion, data] = Object.entries(releases).find(([version, data]) => data.status === 'current');
    data.version = latestVersion;
    latestVersions[browser] = data;
}

//console.log({latestVersions});

function featureSupportedByAllMajorBrowsers(featureData) {
    for (const browser of majorBrowsers) {
        const latestVersion = latestVersions[browser];
        if (featureData.stats[browser][latestVersion.version] !== "y") {
            return false;
        }
    }
    return true;
}

debugger;

const keystoneReleaseDates = {};

for (const id in features) {
    if (!featureSupportedByAllMajorBrowsers(features[id])) continue;
    const browserReleaseDates = majorBrowsers
        .filter(browser => browser !== 'and_chr') // caniuse only includes data for latest and_chr
        .map(browser => {
            const [{version, releaseDate}] = Object.entries(features[id].stats[browser])
                .filter(entry => entry[1] === 'y')
                .map(([version]) => {
                    // handle version ranges
                    if (/-/.test(version)) {
                        version = version.split('-')[0];
                    }
                    if (version.endsWith('.0')) {
                        version = version.slice(0, version.length - 2);
                    }
                    let release = bcd[browser].releases[version];
                    if (!release) {
                        const majorVersion = Number(version.split('.')[0]);
                        release = bcd[browser].releases[majorVersion + 1];
                        if (!release) {
                            if (!agents[browser].usage_global[version]) {
                                // this version is presumably unreleased
                                return ({version, releaseDate: '9999'});
                            }
                            throw new Error(`${id} ${browser} has no BCD release ${version}`);
                        }
                    }
                    const releaseDate = release.release_date;
                    //console.log('  ', id, browser, version, releaseDate);
                    return {version, releaseDate};
                })
                .sort((a,b) => a.releaseDate.localeCompare(b.releaseDate));
            //console.log(id, browser, version, releaseDate);
            return {browser, version, releaseDate};
        });
    const {browser, version, releaseDate} = browserReleaseDates.sort((a,b) => a.releaseDate.localeCompare(b.releaseDate)).at(-1);
    console.log(id, browser, version, releaseDate);
    keystoneReleaseDates[id] = releaseDate;
}

writeFileSync('keystone-release-dates.json', JSON.stringify(keystoneReleaseDates, null, 2), 'utf8');
