/**
 * The sum of all browsers (agents) marketshare doesn't add up to 100%
 * StatCounter declares a surprisingly large quantity of "Other" untracked traffic.
 * 
 * For example, addEventListener (keystoned in IE9 in 2011) has only 97.75% share
 * according to caniuse, but the sum of all tracked browsers is only 97.78%.
 * Thus, addEventListener has 99.96% of all *tracked* traffic.
 * 
 * We only care about the marketshare of tracked traffic, so we'll divide all
 * `usage_perc_y` values by (100% - darkMatter%) to compute a "tracked marketshare."
 */
export function computeDarkMatter(agents) {

    let total = 0;
    for (const agent in agents) {
        const share = sum(Object.values(agents[agent].usage_global));
        total += share;
    }
    total /= 100;
    return total;
}

function sum(array) {
    return array.reduce((prev, curr) => prev + curr, 0);
}
