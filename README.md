# Baseline Calculator: How long until I can use?

How long does it take for web features to achieve widespread availability?

**tl;dr: 63 features became eligible for Baseline in 2020. 95% of those features achieved 95% market share in 31 months.**

# Background: How should "Baseline" be defined?

[Web Platform Baseline](https://web.dev/baseline/) is designed to provide clear information about which web platform features are safe to use in your projects today.

> Features become part of Baseline when they are supported in the current and previous version of all major browsers—Chrome, Edge, Firefox, and Safari.

Since then, we've been discussing at https://github.com/web-platform-dx/feature-set/issues/174 whether 2 major versions is long enough to wait.

Part of that discussion has been to ask whether we should wait for more versions (how many?) and how we should define a "major" version.

But we've also considered whether instead to wait a certain amount of _time_ to consider a feature as part of Baseline, or to wait for a certain threshold of _market share_ instead.

## Can we define Baseline based on market share instead?

[caniuse.com](https://caniuse.com/) provides a convenient report on browser version market share. For example, in May 2023, <https://caniuse.com/dialog> shows that only 94% of users can use the new `<dialog>` element, even though it's available in Safari 15.6 and up since July 2022. (When I launched a feature using `<dialog>` in March, I got a lot of complaints.) 

But there are problems with defining "Baseline" based on market share like this:

* What should the threshold be? 95% share? 98%? 99%?
* What source of market share data should we use? Caniuse gathers its data from [StatCounter](https://gs.statcounter.com/), but allows you to upload your own data from Google Analytics. Browser market share varies a lot from region to region, and from site to site.
* How should market share data be measured?
    * Should we count the percentage of page views? (So people who view more web pages should count more?)
    * Should we count unique visitors? (How should visitors be deduplicated?)
    * Surely we should exclude bots. But how, exactly?
* We want the definition of Baseline to be easy to explain. Any way we decide to answer the above questions, there would be a lot of _details_ to explain.

## Can we define Baseline based on time instead?

It would be easy to define Baseline by saying that a feature is in Baseline two years after the feature is supported in all major browsers.

That's a simple, objectively verifiable definition. The problem is: is two years the right amount of time? Should it be four years? One year? Six months?

This repository is intended to answer that question:

**How many months/years does it take for a feature to reach widespread availability?**

# Methodology

## Data Source: Caniuse and StatCounter

Caniuse.com makes its data available via Github under a CC-BY-4.0 license. https://github.com/fyrd/caniuse The data is in `data.json`. (Browser release dates are in `data-2.0.json`, but `data.json` has a longer git history.) We're very grateful to have access to this treasure trove of data.

Caniuse data pulls its market-share data from [StatCounter](https://gs.statcounter.com).

## "Keystone" Release Date: The date a feature first became available in all major browsers

As features become available in all major browsers, one browser goes first, then another goes second, until eventually the last major browser supports it.

We'll call that last major browser to support the feature the "keystone browser." (In a curved stone archway, the "keystone" is the one at the very center of the top. The keystone is added last, and holds all of the other stones together.)

The "keystone version" is the version that makes its browser the keystone, and the "keystone release date" is the release date of the keystone version.

For example, the [CSS revert value](https://caniuse.com/css-revert-value) feature was first available in Safari 9.1 in 2016, then in Firefox 67 in 2019, then Chrome 84 on July 14, 2020, then in Edge 84 on July 16, 2020.

So, in this example, Edge was the "keystone browser" for the feature; Edge 84 was the "keystone version," and the "keystone release date" was July 16, 2020.

This repository includes a Node script, `compute-keystone-release-dates.mjs`, which generated `keystone-release-dates.json`, which is also checked in.

`compute-keystone-release-dates.mjs` uses the feature data from Caniuse's `data-2.0.json`, finds all of the features that are currently available in all major browsers, then computes the keystone release date for those features, generating `keystone-release-dates.json`.

## Historical Market Share

We gather historical market share data from the Git history of the Caniuse `data.json` file.

`compute-historical-share.mjs` pulls the `git log` of `data.json`, then uses `git checkout` to view it at every commit in its history. We track the timestamp of the commit and the market share of each feature in the commit in `historical-feature-data.json`.

### There's a catch: StatCounter/Caniuse doesn't track Android Chrome versions

<https://gs.statcounter.com/browser-version-market-share>

StatCounter lists all Android Chrome as "Chrome for Android," without breaking it down by version at all. You'll see that caniuse.com lists all Chrome Android traffic as coming from the latest release version of Chrome, v113. There's a filed issue about this, here: https://github.com/Fyrd/caniuse/issues/3518

We know for sure that Chrome 113 doesn't have 100% of Android Chrome market share, because if you're on Android 6 (2015) or below, you can't upgrade to the latest version of Google Chrome. <https://en.wikipedia.org/wiki/Template:Google_Chrome_release_compatibility>

StatCounter does provide an Android Version Market Share report. <https://gs.statcounter.com/android-version-market-share/> (Note that this report is about Android OS versions, *not* browser versions.)

In May 2023, Android 6 is 1.67% of Android traffic, and "Other" is about 3% more. StatCounter says that Chrome for Android is around 40% of global traffic; if we assume that 5% of those 40 points are on very old versions of Android, then roughly 2% of global traffic is falsely reported as belonging to the latest version of Google Chrome, when, in fact, they're on older versions.

But we do have a partial mitigation: although the current `HEAD` revision of caniuse `data.json` does not include accurate historical data about Android Chrome, we're measuring historical data by checking out old revisions of `data.json`, and those old revisions _are_ accurate about the then-current version of Android Chrome as it was at the time. (But they were wrong even then about then-obsolete versions of Chrome.)

I don't think that this will fundamentally alter the final results, but, if we're concerned about it, we could try to investigate another data source, e.g. Akamai's RUM Archive. https://github.com/rum-archive/rum-archive

### And another catch: Caniuse lists a huge amount of unknown-browser "Other" traffic ("dark matter"), so we'll just factor that out

When you sum the marketshare of all of the browsers in caniuse's data set, it doesn't add up to 100%. It's not even _supposed_ to add up to 100%, because StatCounter doesn't track all browsers; it lumps unknown browsers into a mysterious "Other" category.

As of Aug 2023, all of caniuse's browsers add up to 97.78%, leaving 2.22% share unknown. Caniuse's approach is to be pessimistic about the unknown share, assuming that no features work in the unknown browsers.

So, for example, <https://caniuse.com/inline-block>, which was available in all browsers in 2009, and works in all browsers and browser versions that caniuse tracks, is currently only at 97.78% global marketshare according to caniuse, because of that 2.22% unknown "dark matter" traffic. It is simply impossible for `inline-block` to reach 98% share on caniuse.

Here, we're going to compensate for dark matter, by computing the total share of all tracked browsers (97.78%), and dividing all of caniuse's marketshare numbers by that amount, the "dark matter factor". For example, `inline-block` has 100% share in our analysis. To pick another example, we'll say that <https://caniuse.com/es6-module>, which caniuse says has 94.92% share, actually has 94.92% / 0.9778 = 97.07% share.

We'll call this number the "tracked marketshare" for the feature, in contrast with caniuse's number.

And we calculate this "dark matter factor" at each point in history. For example, in Jan 2019, the dark matter factor was 95.90%, so, when we're assessing the tracked marketshare of a feature in Jan 2019, we'll divide its caniuse Jan 2019 marketshare by 95.90%.

## Target Dates

Using `keystone-release-dates.json` and `historical-feature-data.json`, we can compute the dates at which each feature reached certain marketshare targets. We do this with a `compute-target-dates.mjs` script.

We start by considering only the web features that are supported by all major browsers. I'm calling those features "Baselineable" features. Baselineable features _could_ become part of Baseline, but only if/when they achieve "enough" market share. (As of Aug 2023, there are 177 Baselineable features, supported in the current latest versions of all major browsers.)

We compute the following dates for each Baselineable feature:

* Date the feature reached 80% marketshare
* … 85% marketshare
* … 90% marketshare
* … 91% marketshare
* … 92% marketshare
* … 93% marketshare
* … 94% marketshare
* … 95% marketshare
* … 96% marketshare
* … 97% marketshare
* … 98% marketshare
* … 99% marketshare

If the feature has not yet reached that level of marketshare, we leave it `null`.

The output is a `target-dates.json` file, which looks like this:

```json
{
  "abortcontroller": {
    "keystone": "2019-04-02",
    "marketshare": 97.01,
    "reached": {
      "80": "2018-11-06",
      "85": "2019-07-08",
      "90": "2020-03-05",
      "91": "2020-05-08",
      "92": "2020-08-11",
      "93": "2021-02-05",
      "94": "2021-11-04",
      "95": "2022-07-03",
      "96": "2022-11-04",
      "97": "2023-06-03",
      "98": null,
      "99": null
    }
  },
}
```

`compute-target-dates.mjs` also generates a `survival-input-data.csv` file, which you can open in any spreadsheet. You can sort/filter the features by any column, just to get a feel for the data.

## Baseline Calculator

`baseline-calculator.mjs` does the work here, based on `target-dates.json`.

For example, let's just look at the features launched in 2019. Here they all are, based on `survival-input-data.csv`.

feature|indeterminate-checkbox|brotli|flac|download|pointer|rellist|date-tolocaledatestring|abortcontroller
---|---|---|---|---|---|---|---|---
marketshare|98.57|97.41|97.38|97.57|97.23|97.53|96.93|97
days to 80%|0|0|0|0|37|0|35|0
days to 85%|0|0|0|46|99|63|156|97
days to 90%|0|0|0|76|193|276|338|338
days to 91%|0|0|203|76|374|338|402|402
days to 92%|164|0|203|138|434|379|521|497
days to 93%|224|76|203|138|480|472|856|675
days to 94%|316|138|232|209|647|583|947|947
days to 95%|346|413|505|505|953|976|1188|1188
days to 96%|558|869|869|654|1057|1266|1347|1312
days to 97%|955|1353|1353|1018|1314|1523|not yet|1523
days to 98%|1274|not yet|not yet|not yet|not yet|not yet|not yet|not yet
days to 99%|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet

Our goal is to perform a [survival analysis](https://en.wikipedia.org/wiki/Survival_analysis). For the table above, we can ask questions like this, which you can answer just by looking at the table above:

* How long did it take 50% of 2019's features (four features) to reach 80% marketshare? (0 days)
* How long did it take 100% of 2019's features to reach 80% marketshare? (37 days = 1 month)
* How long did it take 50% of 2019's features (four features) to reach 95% marketshare? (505 days = 17 months)
* How long did it take 100% of 2019's features to reach 95% marketshare? (1,188 days = 40 months)
* How long did it take 50% of 2019's features (four features) to reach 98% marketshare? (it hasn't happened yet!)

For each question, we ask about a target marketshare (e.g. 95% share) and a percentile of Baselineable features that have reached the target marketshare (e.g. 50% of features).

For the eight features of 2019, listed above, we can build a table of these questions and answers, like this:

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features|100% of features
---|---|---|---|---|---|---|---|---|---
80% share|0 months|0 months|1 months|1 months|1 months|1 months|1 months|1 months|1 months
85% share|2 months|3 months|3 months|5 months|5 months|5 months|5 months|5 months|5 months
90% share|3 months|9 months|11 months|11 months|11 months|11 months|11 months|11 months|11 months
91% share|7 months|12 months|13 months|13 months|13 months|13 months|13 months|13 months|13 months
92% share|7 months|14 months|17 months|17 months|17 months|17 months|17 months|17 months|17 months
93% share|7 months|16 months|23 months|29 months|29 months|29 months|29 months|29 months|29 months
94% share|11 months|22 months|32 months|32 months|32 months|32 months|32 months|32 months|32 months
95% share|17 months|33 months|40 months|40 months|40 months|40 months|40 months|40 months|40 months
96% share|29 months|42 months|44 months|45 months|45 months|45 months|45 months|45 months|45 months
97% share|45 months|51 months|51 months|not yet|not yet|not yet|not yet|not yet|not yet
98% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
99% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet

That's what the Baseline calculator does, either for all features for all time, or just for a specified calendar year.

# Reproducing Results

## Submodules

We gather data from `caniuse` via a Github submodule. The first step is to populate the submodule, like this:

```
git submodule update --init --recursive
```

(You can skip this step if you just want to run `baseline-calculator.mjs`.)

## Generating data

1. Run `compute-keystone-release-dates.mjs` to generate `keystone-release-dates.json`
2. Run `compute-historical-share.mjs` to generate `historical-feature-data.json`.
3. Run `compute-target-dates.mjs` to generate `target-data.json` and `survival-input-data.csv`
3. Run `baseline-calculator.mjs` to generate the result table

# Interpretation of Results

Here are the results of running `baseline-calculator.mjs` on all features for all time.

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features|100% of features
---|---|---|---|---|---|---|---|---|---
80% share|0 months|1 months|2 months|6 months|14 months|15 months|17 months|17 months|43 months
85% share|0 months|3 months|3 months|10 months|16 months|17 months|20 months|43 months|not yet
90% share|3 months|9 months|11 months|18 months|35 months|not yet|not yet|not yet|not yet
91% share|5 months|12 months|16 months|23 months|44 months|not yet|not yet|not yet|not yet
92% share|7 months|16 months|20 months|28 months|not yet|not yet|not yet|not yet|not yet
93% share|9 months|21 months|24 months|32 months|not yet|not yet|not yet|not yet|not yet
94% share|17 months|28 months|29 months|43 months|not yet|not yet|not yet|not yet|not yet
95% share|22 months|34 months|37 months|not yet|not yet|not yet|not yet|not yet|not yet
96% share|33 months|45 months|51 months|not yet|not yet|not yet|not yet|not yet|not yet
97% share|44 months|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
98% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
99% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet

You'll notice a lot of "not yets" on this table.

Looking at the cell near the upper right (85% share, 100% of features), the table is saying that some features supported in all browsers haven't reached 85% share yet. (It's actually just one feature, `css-media-range-syntax`, shipped as part of iOS 16.4 in March 2023.)

Looking at the cell in the lower left (99% share, 50% of features), the table is saying that more than half of Baselineable features have never achieved 99% market share. In fact, only 12 of the 177 Baselineable features have achieved 99% market share; only 54 have achieved 98% market share.

That's because 98% market share is a surprisingly high bar to achieve. If you insist on avoiding web features that haven't achieved 98% market share, you'll be missing out on features that shipped years ago.

Just to pick a few examples, none of these features have reached 98% market share:

* CSS
    * variables
    * grid
* JS language
    * let/const
    * classes
    * arrow funtions
* JS API
	* Object.entries
	* fetch
	* Array.find
	* Proxy object

All of these features became supported in all major browsers more than five years ago.

Why does it take so long to achieve 98% market share? There are a few reasons:

* Despite browser vendors advertising their "evergreen" release strategy, both Apple and Google have withdrawn support for older devices. Users of these devices can't upgrade to the latest browser version without paying to replace their hardware.
	* If you're on iPhone 7 (2016), you can't upgrade to iOS 16, and so you can't upgrade to Safari 16. <https://en.wikipedia.org/wiki/IOS_version_history>
	* If you're on Android 6 (2015) or below, you can't upgrade to the latest version of Google Chrome. <https://en.wikipedia.org/wiki/Template:Google_Chrome_release_compatibility>
* Even users who can upgrade often upgrade slowly. It's common for iOS users to upgrade annually, if that.
* There are a bunch of weird old browsers out there. Internet Explorer, Opera Mini, UC Browser… these add up to 1% market share all by themselves.

# Cohort Analysis

`baseline-calculator.mjs` also accepts a command-line argument, allowing you to specify a "cohort year." For example, `--cohort=2016` will consider all/only features whose keystone release date was in 2016. (It works by string comparison, so you can even pass a cohort _month_ if you want, like this: `--cohort-2016-08`)

How does it look?
<details><summary>Cohorts by year for seven years</summary>
<p>
Here are the cohorts:

# 2016: 17 features
Features: array-find-index, array-includes, arrow-functions, background-position-x-y, background-repeat-round-space, border-radius, comparedocumentposition, document-scrollingelement, es6-class, es6-generators, font-feature, insert-adjacent, internationalization, localecompare, pagevisibility, proxy, rest-parameters

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features|100% of features
---|---|---|---|---|---|---|---|---|---
80% share|6 months|14 months|14 months|17 months|43 months|43 months|43 months|43 months|43 months
85% share|11 months|14 months|14 months|17 months|43 months|43 months|43 months|43 months|43 months
90% share|18 months|20 months|22 months|26 months|43 months|43 months|43 months|43 months|43 months
91% share|23 months|23 months|24 months|27 months|43 months|43 months|43 months|43 months|43 months
92% share|27 months|28 months|28 months|30 months|43 months|43 months|43 months|43 months|43 months
93% share|31 months|32 months|32 months|35 months|43 months|43 months|43 months|43 months|43 months
94% share|35 months|36 months|36 months|37 months|43 months|43 months|43 months|43 months|43 months
95% share|35 months|38 months|39 months|42 months|43 months|43 months|43 months|43 months|43 months
96% share|36 months|47 months|47 months|47 months|50 months|50 months|50 months|50 months|50 months
97% share|41 months|70 months|72 months|79 months|79 months|79 months|79 months|79 months|79 months
98% share|70 months|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
99% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet

# 2017: 28 features
Features: array-find, async-functions, bloburls, const, css-font-stretch, css-grid, css-variables, css-writing-mode, element-closest, fetch, focusin-focusout-events, form-attribute, form-validation, gamepad, input-pattern, keyboardevent-getmodifierstate, let, matchesselector, meter, object-entries, object-values, once-event-listener, outline, passive-event-listener, svg-css, template, user-timing, viewport-units

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features|100% of features
---|---|---|---|---|---|---|---|---|---
80% share|0 months|3 months|4 months|7 months|17 months|17 months|17 months|17 months|17 months
85% share|2 months|5 months|10 months|17 months|17 months|34 months|34 months|34 months|34 months
90% share|5 months|14 months|15 months|17 months|17 months|44 months|44 months|44 months|44 months
91% share|5 months|18 months|20 months|20 months|21 months|44 months|44 months|44 months|44 months
92% share|15 months|22 months|22 months|23 months|24 months|44 months|44 months|44 months|44 months
93% share|20 months|25 months|26 months|28 months|28 months|44 months|44 months|44 months|44 months
94% share|26 months|29 months|29 months|30 months|32 months|44 months|44 months|44 months|44 months
95% share|28 months|34 months|34 months|37 months|40 months|44 months|44 months|44 months|44 months
96% share|35 months|44 months|49 months|52 months|57 months|57 months|57 months|57 months|57 months
97% share|53 months|68 months|68 months|69 months|69 months|69 months|69 months|69 months|69 months
98% share|75 months|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
99% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet

# 2018: 22 features
Features: beacon, constraint-validation, css-media-interaction, dom-manip-convenience, eme, font-unicode-range, input-minlength, kerning-pairs-ligatures, link-icon-png, pad-start-end, promise-finally, resource-timing, serviceworkers, subresource-integrity, svg-fragment, svg-html5, transforms2d, upgradeinsecurerequests, urlsearchparams, wasm, woff2, wordwrap

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features|100% of features
---|---|---|---|---|---|---|---|---|---
80% share|0 months|0 months|1 months|4 months|8 months|10 months|10 months|10 months|10 months
85% share|0 months|2 months|6 months|8 months|9 months|20 months|20 months|20 months|20 months
90% share|6 months|10 months|14 months|19 months|20 months|35 months|35 months|35 months|35 months
91% share|10 months|14 months|14 months|20 months|21 months|35 months|35 months|35 months|35 months
92% share|13 months|14 months|16 months|20 months|23 months|35 months|35 months|35 months|35 months
93% share|14 months|18 months|19 months|23 months|27 months|35 months|35 months|35 months|35 months
94% share|20 months|21 months|22 months|27 months|35 months|39 months|39 months|39 months|39 months
95% share|23 months|27 months|31 months|35 months|40 months|50 months|50 months|50 months|50 months
96% share|35 months|43 months|43 months|51 months|51 months|52 months|52 months|52 months|52 months
97% share|54 months|61 months|62 months|62 months|62 months|62 months|62 months|62 months|62 months
98% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
99% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet

# 2019: 8 features
Features: abortcontroller, brotli, date-tolocaledatestring, download, flac, indeterminate-checkbox, pointer, rellist

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features|100% of features
---|---|---|---|---|---|---|---|---|---
80% share|0 months|0 months|1 months|1 months|1 months|1 months|1 months|1 months|1 months
85% share|2 months|3 months|3 months|5 months|5 months|5 months|5 months|5 months|5 months
90% share|3 months|9 months|11 months|11 months|11 months|11 months|11 months|11 months|11 months
91% share|7 months|12 months|13 months|13 months|13 months|13 months|13 months|13 months|13 months
92% share|7 months|14 months|17 months|17 months|17 months|17 months|17 months|17 months|17 months
93% share|7 months|16 months|23 months|29 months|29 months|29 months|29 months|29 months|29 months
94% share|11 months|22 months|32 months|32 months|32 months|32 months|32 months|32 months|32 months
95% share|17 months|33 months|40 months|40 months|40 months|40 months|40 months|40 months|40 months
96% share|29 months|42 months|44 months|45 months|45 months|45 months|45 months|45 months|45 months
97% share|45 months|51 months|51 months|not yet|not yet|not yet|not yet|not yet|not yet
98% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
99% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet

# 2020: 63 features
Features: apng, array-flat, bigint, chacha20-poly1305, contentsecuritypolicy2, cryptography, css-all, css-any-link, css-backgroundblendmode, css-caret-color, css-case-insensitive, css-conic-gradients, css-default-pseudo, css-env-function, css-filters, css-focus-within, css-font-rendering-controls, css-in-out-of-range, css-indeterminate-pseudo, css-math-functions, css-placeholder, css-placeholder-shown, css-read-only-write, css-rrggbbaa, css-shapes, css-snappoints, css-supports-api, css-text-orientation, css-textshadow, datauri, details, es6-module, es6-module-dynamic-import, eventsource, fileapi, flow-root, font-kerning, font-loading, font-variant-numeric, getboundingclientrect, iframe-srcdoc, indexeddb, indexeddb2, intl-pluralrules, justify-content-space-evenly, keyboardevent-key, link-rel-preconnect, object-fit, ol-reversed, path2d, prefers-color-scheme, prefers-reduced-motion, rel-noopener, resizeobserver, shadowdomv1, svg, svg-smil, textencoder, tls1-3, unhandledrejection, vector-effect, webgl, will-change

**Note: In January 2020, Microsoft release Edge 79, switching its browser engine to Chromium. That made Edge 79 the keystone browser for dozens of features, way more than usual.**

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features|100% of features
---|---|---|---|---|---|---|---|---|---
80% share|0 months|0 months|0 months|1 months|2 months|6 months|6 months|16 months|16 months
85% share|0 months|0 months|0 months|2 months|3 months|16 months|16 months|16 months|16 months
90% share|0 months|4 months|6 months|9 months|10 months|16 months|16 months|16 months|16 months
91% share|0 months|7 months|7 months|11 months|13 months|16 months|16 months|18 months|18 months
92% share|2 months|9 months|10 months|15 months|16 months|16 months|16 months|22 months|22 months
93% share|2 months|13 months|15 months|19 months|20 months|24 months|24 months|27 months|27 months
94% share|7 months|21 months|22 months|25 months|27 months|29 months|29 months|40 months|40 months
95% share|9 months|30 months|30 months|30 months|31 months|36 months|36 months|41 months|41 months
96% share|21 months|33 months|33 months|41 months|41 months|44 months|44 months|not yet|not yet
97% share|41 months|41 months|not yet|not yet|not yet|not yet|not yet|not yet|not yet
98% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
99% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet

# 2021: 14 features
Features: audio-api, css-image-orientation, css-logical-props, css-matches-pseudo, css-not-sel-list, css-revert-value, css-sticky, css3-tabsize, element-scroll-methods, flexbox-gap, font-family-system-ui, link-rel-preload, mediarecorder, webgl2

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features|100% of features
---|---|---|---|---|---|---|---|---|---
80% share|0 months|1 months|2 months|2 months|2 months|2 months|2 months|2 months|2 months
85% share|0 months|2 months|2 months|3 months|4 months|4 months|4 months|4 months|4 months
90% share|2 months|4 months|5 months|7 months|9 months|9 months|9 months|9 months|9 months
91% share|3 months|6 months|9 months|10 months|14 months|14 months|14 months|14 months|14 months
92% share|5 months|10 months|13 months|14 months|21 months|21 months|21 months|21 months|21 months
93% share|9 months|14 months|20 months|21 months|22 months|22 months|22 months|22 months|22 months
94% share|15 months|18 months|22 months|26 months|not yet|not yet|not yet|not yet|not yet
95% share|22 months|26 months|not yet|not yet|not yet|not yet|not yet|not yet|not yet
96% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
97% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
98% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
99% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet

# 2022: 17 features
Features: border-image, broadcastchannel, css-cascade-layers, css-containment, css-focus-visible, css-font-palette, css-gradients, css-media-resolution, css-motion-paths, css-overflow, css-overscroll-behavior, css-text-align-last, dialog, permissions-api, text-emphasis, transforms3d, webp

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features|100% of features
---|---|---|---|---|---|---|---|---|---
80% share|1 months|1 months|2 months|2 months|2 months|2 months|2 months|2 months|2 months
85% share|3 months|3 months|3 months|3 months|5 months|5 months|5 months|5 months|5 months
90% share|5 months|6 months|6 months|8 months|9 months|9 months|9 months|9 months|9 months
91% share|6 months|7 months|7 months|10 months|not yet|not yet|not yet|not yet|not yet
92% share|8 months|9 months|10 months|not yet|not yet|not yet|not yet|not yet|not yet
93% share|9 months|11 months|not yet|not yet|not yet|not yet|not yet|not yet|not yet
94% share|15 months|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
95% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
96% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
97% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
98% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
99% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet

# 2023: 8 features
Features: colr, css-container-queries, css-container-query-units, css-media-range-syntax, import-maps, js-regexp-lookbehind, screen-orientation, viewport-unit-variants

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features|100% of features
---|---|---|---|---|---|---|---|---|---
80% share|0 months|2 months|2 months|2 months|2 months|2 months|2 months|2 months|2 months
85% share|1 months|2 months|3 months|not yet|not yet|not yet|not yet|not yet|not yet
90% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
91% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
92% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
93% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
94% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
95% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
96% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
97% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
98% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet
99% share|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet




</p>
</details> 

That's a lot of tables, so, here's just the "95% features" column, by cohort year:

Market Share|80% share|85% share|90% share|91% share|92% share|93% share|94% share|95% share|96% share|97% share
---|---|---|---|---|---|---|---|---|---|---
2016|43 months|43 months|43 months|43 months|43 months|43 months|43 months|43 months|50 months|79 months
2017|17 months|17 months|17 months|21 months|24 months|28 months|32 months|40 months|57 months|69 months
2018|8 months|9 months|20 months|21 months|23 months|27 months|35 months|40 months|51 months|62 months
2019|1 months|5 months|11 months|13 months|17 months|29 months|32 months|40 months|45 months|not yet
2020|2 months|3 months|10 months|13 months|16 months|20 months|27 months|31 months|41 months|not yet
2021|2 months|4 months|9 months|14 months|21 months|22 months|not yet|not yet|not yet|not yet
2022|2 months|5 months|9 months|not yet|not yet|not yet|not yet|not yet|not yet|not yet
2023|2 months|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet|not yet

## Interpretation of Cohort Analysis: It's improving!

Every column shows improvement over time. Next year, we might find that the 2021 cohort has an even better result.

# Conclusion: Baseline can and should be time-based

* **The new goal should be "95% of features with 95% market share."** That is, we should say "Baseline means that a feature has been supported in all major browsers for N months." And then, we should choose an N such that 95% of features have achieved 95% market share in that time. I picked the numbers 95 and 95 just because they feel reasonable to me.
* **We should consider only the latest cohort year for determining "N" months.** 95% of 2016's Baselineable features took 43 months to reach 95% market share. 95% of 2020's Baselineable features took just 31 months to get there. Based on this data, we should define Baseline based on the latest cohort year in which 95% of features have achieved 95% market share. Currently, that's 31 months for 2020, but we can update this in future years based on new data.
* **Therefore, in 2023, Baseline should be defined as features that have been available in all major browsers for at least 31 months (2.5 years).**
