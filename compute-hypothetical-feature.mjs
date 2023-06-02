#!/usr/bin/env node
import {readFileSync} from 'node:fs';

import {compare} from 'compare-versions';

const caniuse = JSON.parse(readFileSync('caniuse/fulldata-json/data-2.0.json', 'utf8'));
const historicalBrowserData = JSON.parse(readFileSync('historical-browser-data.json', 'utf8'));

// Sort the data in |historicalBrowserData| so that we can search it by date later.
for (const snapshots of Object.values(historicalBrowserData)) {
    snapshots.sort((a, b) => a.timestamp - b.timestamp);
}

const browsers = ['chrome', 'edge', 'firefox', 'safari'];

const endDate = new Date();

// Pre-process |a| and |b| to normalize some caniuse versions.
function caniuseCompare(a, b, cmp) {
    function normalize(version) {
        if (version == 'TP') {
            // Treat Safari TP as a future release. It doesn't matter because
            // it has no usage in the caniuse data.
            return String(Number.MAX_SAFE_INTEGER);
        }
        if (version == '15.2-15.3') {
            return '15.2';
        }
        return version;
    }
    return compare(normalize(a), normalize(b), cmp);
}

// timestamp is number of seconds since epoch
function caniuseDate(timestamp) {
  return new Date(1000 * timestamp);
}

// from (inclusive) and to (exclusive) are Date objects.
// TODO: this isn't quite right, date 
function* iterateMonths(from, to) {
    const iter = new Date(from);
    while (iter < to) {
        yield new Date(iter);
        // Add one calendar month.
        const nextMonth = (iter.getUTCMonth() + 1) % 12;
        if (nextMonth == 0) {
            iter.setUTCFullYear(iter.getUTCFullYear() + 1);
        }
        iter.setUTCMonth(nextMonth);
    }
}

function monthString(date) {
    return date.toISOString().substr(0, 10);
}

// Find the usage of a browser at a given date. The exact date is probably not
// found in |historicalBrowserData|, so use the latest entry at or before
// |date|. If there is none, return the very latest entry. The caller needs to
// check that the data is fresh enough before using it.
function getHistoricalUsage(browser, date) {
    const snapshots = historicalBrowserData[browser];
    // TODO: binary search would be O(log(n)) instead of O(n).
    const index = snapshots.findLastIndex((s) => caniuseDate(s.timestamp) <= date);
    // Index could be -1, and we return the latest snapshot in this case.
    return snapshots.at(index);
}

const months = Array.from(iterateMonths(Date.parse('2020-01-01T00:00Z'), endDate));

function getVersionAfter(browser, date) {
    for (const release of caniuse.agents[browser].version_list) {
        if (!release.release_date) {
            continue;
        }
        const releaseDate = caniuseDate(release.release_date);
        if (releaseDate >= date) {
            return release.version;
        }
    }
    return null;
}

for (const startIndex of months.keys()) {
    const launchDate = months[startIndex];
    // Assume that a hypothetical feature is enabled in all browser engines at
    // |launchDate| and is available in all following browser releases. Step
    // forward one month at a time and compute availability based on the
    // historical usage stats in |historicalBrowserData|.

    // Identify the version of each browser where the feature was first available.
    // This is done up front to make it simpler to determine if each release has
    // the feature later based on the version, not the release date.
    const launchVersions = {};
    for (const browser of browsers) {
        launchVersions[browser] = getVersionAfter(browser, launchDate);
    }

    console.log(monthString(launchDate));
    for (let index = startIndex; index < months.length; index++) {
        const month = months[index];

        let totalUsage = 0;
        let totalAvailability = 0;

        let missingData = false;
        for (const browser of browsers) {
            const launchVersion = launchVersions[browser];
            if (!launchVersion) {
                missingData = true;
                break;
            }

            const historicalUsage = getHistoricalUsage(browser, month);
            if (!historicalUsage) {
                missingData = true;
                break;
            }

            // TODO check freshness of |historicalUsage|.
            //console.debug(`  Usage data from ${caniuseDate(historicalUsage.timestamp).toISOString()}`);

            let browserUsage = 0;
            let browserAvailability = 0;
            for (const [version, usage] of Object.entries(historicalUsage.usage_global)) {
                browserUsage += usage;
                let support = false;
                if (caniuseCompare(version, launchVersion, '>=')) {
                    support = true;
                    browserAvailability += usage;
                }
                //console.debug(browser, version, usage, support ? '(included)' : '(not included)');
            }
            totalUsage += browserUsage;
            totalAvailability += browserAvailability;
            console.log(`  -> ${monthString(month)}: ${browser} availability ${(100 * browserAvailability / browserUsage).toFixed(2)}% (${browserAvailability.toFixed(2)}% / ${browserUsage.toFixed(2)}%)`);
        }
        if (!missingData) {
            console.log(`  -> ${monthString(month)}: TOTAL availability ${(100 * totalAvailability / totalUsage).toFixed(2)}% (${totalAvailability.toFixed(2)}% / ${totalUsage.toFixed(2)}%) (of the included browsers)`);
        }
    }
}
