import { readFileSync } from 'node:fs';

const target = 95;
const almostTarget = 94;

const { data: features } = JSON.parse(readFileSync('caniuse/data.json', 'utf8'));

const keystoneReleaseDates = JSON.parse(readFileSync('keystone-release-dates.json', 'utf8'));

const results = Object.fromEntries(Object.keys(keystoneReleaseDates).filter(featureId => 
    features[featureId].usage_perc_y < target && features[featureId].usage_perc_y > almostTarget
).map(featureId => 
    [featureId, {
        usage_perc_y: features[featureId].usage_perc_y,
        keystone_date: keystoneReleaseDates[featureId]
    }]
));

console.log(JSON.stringify(results, null, 2));