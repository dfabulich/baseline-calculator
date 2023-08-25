import { readFileSync } from 'node:fs';

const { data: features } = JSON.parse(readFileSync('caniuse/data.json', 'utf8'));

const keystoneReleaseDates = JSON.parse(readFileSync('keystone-release-dates.json', 'utf8'));

const results = Object.keys(keystoneReleaseDates).map(featureId => 
    [
        featureId,
        features[featureId].usage_perc_y,
        keystoneReleaseDates[featureId]
    ]
);

console.log(`feature_id,marketshare,keystone_date`);

console.log(results.map(row => row.join(',')).join('\n'));
