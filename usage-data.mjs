import {readFileSync, writeFileSync} from 'node:fs';
import {compareVersions} from 'compare-versions';

const {agents} = JSON.parse(readFileSync('caniuse/data.json', 'utf8'));

// Pre-process |a| and |b| to normalize some caniuse versions.
function caniuseCompare(a, b) {
    function normalize(version) {
        // Treat Safari TP as a future release. It doesn't matter because
        // it has no usage in the caniuse data.
        if (version == 'TP') {
            return String(Number.MAX_SAFE_INTEGER);
        }
        // For ranges like 1.0-2.0, use the first part of the range.
        const parts = version.split('-');
        if (parts.length === 2) {
            return parts[0];
        }
        return version;
    }
    return compareVersions(normalize(a), normalize(b));
}

// Lines of a CSV file
const lines = ['agent,version,usage'];

for (const [agent, agentData] of Object.entries(agents)) {
    const versions = Object.keys(agentData.usage_global);
    versions.sort(caniuseCompare);
    for (const version of versions) {
        const usage = agentData.usage_global[version];
        lines.push(`${agent},${version},${usage}`);
    }
}

const csv = lines.join('\n') + '\n';

writeFileSync('usage-data.csv', csv, 'utf8');
