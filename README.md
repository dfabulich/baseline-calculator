# Baseline Calculator: How long until I can use?

How long does it take for web features to achieve widespread availability?

**tl;dr: The features released in 2020 took 30 months to achieve 95% market share.**

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

## Baseline Calculator

`baseline-calculator.mjs` does the work here, based on `keystone-release-dates.json`, `historical-feature-data.json`, and caniuse's `data.json`.

Our goal is to perform a [survival analysis](https://en.wikipedia.org/wiki/Survival_analysis).

We start by considering only the web features that are supported by all major browsers. I'm calling those features "Baselineable" features. Baselineable features _could_ become part of Baseline, but only if/when they achieve "enough" market share. (As of May 2023, there are 311 Baselineable features, supported in the current latest versions of all major browsers.)

Based on the list of Baselineable features, we build a table of values, where each cell is defined by two numbers:

* a target market share (e.g. 95% market share)
* a percentage of Baselineable features that have reached the target market share (e.g. 80% of Baselineable features)

Some Baselineable features have never reached 95% market share, despite being supported in all browsers for years. But, for each Baselineable feature that _has_ achieved 95% market share, we can compute how long it took to get there, starting at the feature's "keystone release date," until the date it reached 95% market share.

We can then sort the features by how long it took them to achieve 95% market share. (Some features took just one month to get 95% market share; the `<progress>` element took 70 months to get there.)

Then, we compute the 80th percentile, i.e. how long it took 80% of Baselineable features to reach 95% market share. (Answer: 48 months.)

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
3. Run `baseline-calculator.mjs` to generate the result table

# Interpretation of Results

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features
---|---|---|---|---|---|---|---|---
80% share|0 months|2 months|5 months|16 months|21 months|24 months|29 months|never
90% share|7 months|21 months|22 months|32 months|never|never|never|never
95% share|30 months|45 months|48 months|never|never|never|never|never
97% share|56 months|never|never|never|never|never|never|never
98% share|never|never|never|never|never|never|never|never
99% share|never|never|never|never|never|never|never|never

You'll notice a lot of "nevers" on this table.

Looking at the cell in the upper right (80% share, 99% of features), the table is saying that out of 311 Baselineable features, at least 1% haven't achieved 80% market share yet.

As of May 2023, those features are:

* [css-media-range-syntax](https://caniuse.com/css-media-range-syntax)
* [import-maps](https://caniuse.com/import-maps)
* [js-regexp-lookbehind](https://caniuse.com/js-regexp-lookbehind)
* [offscreencanvas](https://caniuse.com/offscreencanvas)

… and they all shipped as part of iOS 16.4 in March 2023.

Looking at the cell in the lower left (99% share, 50% of features), the table is saying that more than half of Baselineable features have never achieved 99% market share. In fact, only 61 of the 311 Baselineable features have achieved 99% market share; only 143 have achieved 98% market share.

That's because 98% market share is a surprisingly high bar to achieve. If you insist on avoiding web features that haven't achieved 98% market share, you'll be missing out on features that shipped years ago.

Just to pick a few examples, none of these features have reached 98% market share:

* CSS
    * calc
    * grid
* JS language
    * let/const
    * classes
    * arrow funtions
    * destructuring
    * template literals
* JS API
	* Promises
	* IndexedDB
	* URL API
	* Proxy object
* File formats
    * TTF
    * MP3 audio
    * MP4/H.264 video

All of these features became supported in all major browsers more than five years ago. Many of them became supported in all major browsers in 2015 with the release of Edge 12.

Why does it take so long to achieve 98% market share? There are a few reasons:

* Despite browser vendors advertising their "evergreen" release strategy, both Apple and Google have withdrawn support for older devices. Users of these devices can't upgrade to the latest browser version without paying to replace their hardware.
	* If you're on iPhone 7 (2016), you can't upgrade to iOS 16, and so you can't upgrade to Safari 16. <https://en.wikipedia.org/wiki/IOS_version_history>
	* If you're on Android 6 (2015) or below, you can't upgrade to the latest version of Google Chrome. <https://en.wikipedia.org/wiki/Template:Google_Chrome_release_compatibility>
* Even users who can upgrade often upgrade slowly. It's common for iOS users to upgrade annually, if that.
* There are a bunch of weird old browsers out there. Internet Explorer, Opera Mini, UC Browser… these add up to 1% market share all by themselves.

# Update: Cohort Analysis

`baseline-calculotar.mjs` now accepts a command-line argument, allowing you to specify a "cohort year." For example, `--cohort=2016` will consider all/only features whose keystone release date was in 2016. (It works by string comparison, so you can even pass a cohort _month_ if you want, like this: `--cohort-2016-08`)

How does it look?
<details><summary>Cohorts by year for eight years (with some funny business around 2015, and cohort by month for April 2021)</summary>
<p>
Here are the cohorts:

## 2015

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features
---|---|---|---|---|---|---|---|---
80% share|0 months|4 months|11 months|18 months|21 months|26 months|29 months|29 months
90% share|11 months|21 months|21 months|31 months|42 months|44 months|44 months|59 months
95% share|32 months|44 months|48 months|56 months|56 months|56 months|56 months|59 months
97% share|46 months|56 months|63 months|70 months|73 months|76 months|83 months|85 months
98% share|58 months|70 months|73 months|never|never|never|never|never
99% share|never|never|never|never|never|never|never|never

### Excluding Edge 12 keystones

We're treating "Edge" as a "major browser," but Edge's first release was Edge 12 in 2015, so a bunch of features have a keystone release date matching Edge 12's release date in July 2015. I've published a branch, `exclude-edge-12-keystones`, which excludes those.

In that branch, there are only 200 Baselineable features (instead of 311), and, focusing just on those features, the all-cohort table looks like this:

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features
---|---|---|---|---|---|---|---|---
80% share|0 months|2 months|5 months|17 months|19 months|24 months|59 months|never
90% share|7 months|21 months|24 months|42 months|never|never|never|never
95% share|30 months|47 months|54 months|never|never|never|never|never
97% share|never|never|never|never|never|never|never|never
98% share|never|never|never|never|never|never|never|never
99% share|never|never|never|never|never|never|never|never

On that branch, the 2015 table looks like this:

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features
---|---|---|---|---|---|---|---|---
80% share|12 months|18 months|19 months|29 months|59 months|59 months|59 months|59 months
90% share|23 months|42 months|42 months|42 months|59 months|59 months|59 months|59 months
95% share|46 months|54 months|54 months|56 months|59 months|59 months|59 months|59 months
97% share|66 months|74 months|83 months|85 months|87 months|87 months|87 months|87 months
98% share|91 months|never|never|never|never|never|never|never
99% share|never|never|never|never|never|never|never|never

## 2016

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features
---|---|---|---|---|---|---|---|---
80% share|12 months|17 months|19 months|20 months|23 months|23 months|23 months|23 months
90% share|30 months|32 months|36 months|36 months|37 months|37 months|37 months|37 months
95% share|44 months|47 months|48 months|48 months|53 months|53 months|53 months|53 months
97% share|72 months|never|never|never|never|never|never|never
98% share|never|never|never|never|never|never|never|never
99% share|never|never|never|never|never|never|never|never

## 2017

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features
---|---|---|---|---|---|---|---|---
80% share|1 months|10 months|10 months|13 months|18 months|24 months|24 months|24 months
90% share|17 months|24 months|24 months|25 months|29 months|44 months|44 months|44 months
95% share|35 months|43 months|44 months|44 months|47 months|57 months|57 months|57 months
97% share|65 months|never|never|never|never|never|never|never
98% share|never|never|never|never|never|never|never|never
99% share|never|never|never|never|never|never|never|never

## 2018

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features
---|---|---|---|---|---|---|---|---
80% share|0 months|1 months|4 months|6 months|8 months|10 months|10 months|10 months
90% share|12 months|15 months|16 months|18 months|20 months|35 months|35 months|35 months
95% share|28 months|35 months|36 months|40 months|40 months|47 months|47 months|47 months
97% share|never|never|never|never|never|never|never|never
98% share|never|never|never|never|never|never|never|never
99% share|never|never|never|never|never|never|never|never

## 2019

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features
---|---|---|---|---|---|---|---|---
80% share|0 months|2 months|2 months|20 months|20 months|20 months|20 months|20 months
90% share|7 months|14 months|14 months|29 months|29 months|29 months|29 months|29 months
95% share|22 months|40 months|40 months|never|never|never|never|never
97% share|never|never|never|never|never|never|never|never
98% share|never|never|never|never|never|never|never|never
99% share|never|never|never|never|never|never|never|never

## 2020

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features
---|---|---|---|---|---|---|---|---
80% share|0 months|0 months|0 months|2 months|3 months|6 months|6 months|16 months
90% share|0 months|6 months|8 months|10 months|13 months|16 months|16 months|16 months
95% share|10 months|30 months|30 months|33 months|33 months|never|never|never
97% share|never|never|never|never|never|never|never|never
98% share|never|never|never|never|never|never|never|never
99% share|never|never|never|never|never|never|never|never

## 2021

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features
---|---|---|---|---|---|---|---|---
80% share|0 months|1 months|2 months|2 months|2 months|2 months|2 months|2 months
90% share|3 months|8 months|10 months|13 months|14 months|14 months|14 months|14 months
95% share|never|never|never|never|never|never|never|never
97% share|never|never|never|never|never|never|never|never
98% share|never|never|never|never|never|never|never|never
99% share|never|never|never|never|never|never|never|never

### April 2021

```
node baseline-calculator.mjs --cohort=2021-04
```

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features
---|---|---|---|---|---|---|---|---
80% share|0 months|2 months|2 months|2 months|2 months|2 months|2 months|2 months
90% share|3 months|5 months|14 months|14 months|14 months|14 months|14 months|14 months
95% share|25 months|25 months|never|never|never|never|never|never
97% share|never|never|never|never|never|never|never|never
98% share|never|never|never|never|never|never|never|never
99% share|never|never|never|never|never|never|never|never

## 2022

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features
---|---|---|---|---|---|---|---|---
80% share|1 months|2 months|2 months|2 months|2 months|3 months|3 months|3 months
90% share|5 months|14 months|never|never|never|never|never|never
95% share|never|never|never|never|never|never|never|never
97% share|never|never|never|never|never|never|never|never
98% share|never|never|never|never|never|never|never|never
99% share|never|never|never|never|never|never|never|never

## 2023

Market Share|50% of features|75% of features|80% of features|90% of features|95% of features|97% of features|98% of features|99% of features
---|---|---|---|---|---|---|---|---
80% share|1 months|never|never|never|never|never|never|never
90% share|never|never|never|never|never|never|never|never
95% share|never|never|never|never|never|never|never|never
97% share|never|never|never|never|never|never|never|never
98% share|never|never|never|never|never|never|never|never
99% share|never|never|never|never|never|never|never|never



</p>
</details> 

That's a lot of tables, so, here's just the "80% features" column, by cohort year (excluding the Edge 12 keystones):

Year|80% share|90% share|95% share|97% share|98% share|99% share
---|---|---|---|---|---|---
2015|19 months|42 months|54 months|83 months|never|never
2016|19 months|36 months|48 months|never|never|never
2017|10 months|24 months|44 months|never|never|never
2018|4 months|16 months|36 months|never|never|never
2019|2 months|14 months|40 months|never|never|never
2020|0 months|8 months|30 months|never|never|never
2021|2 months|10 months|never|never|never|never
2022|2 months|never|never|never|never|never
2023|never|never|never|never|never|never

## Interpretation of Cohort Analysis: It's improving!

Every column shows improvement over time. Next year, we might find that the 2021 cohort has an even better result.

(Based on the "April 2021" cohort above, I predict that 2021's features will reach 95% market share in less than 30 months, but closer to 30 than 24.)

# Conclusion: Baseline can and should be time-based

* **We should change the goal for the Baseline definition.** The current goal for the definition of Baseline is to set a guideline that "works for most developers most of the time." I've argued elsewhere that [this goal has no meaning](https://github.com/web-platform-dx/feature-set/issues/174#issuecomment-1544481323), that it's impossible use data to argue whether a feature does or doesn't work for most developers (or any developer) most of the time.
* **The new goal should be "80% of features with 95% market share."** That is, we should say "Baseline means that a feature has been supported in all major browsers for N months." And then, we should choose an N such that 80% of features have achieved 95% market share in that time. I picked the numbers 80 and 95 just because they feel reasonable to me.
* **We should consider only the latest cohort year for determining "N" months.** 80% of 2015's Baselineable features took 54 months to reach 95% market share. 80% of 2020's Baselineable features took just 30 months to get there. Based on this data, we should define Baseline based on the latest cohort year in which 80% of features have achieved 95% market share. Currently, that's 30 months for 2020, but we can update this in future years based on new data.
* **Therefore, in 2023, Baseline should be defined as features that have been available in all major browsers for at least 30 months (2.5 years).**
