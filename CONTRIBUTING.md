# Contributing to OpenReview Web

Welcome, and thank you for your interest in contributing to the OpenReview web interface!

## Asking Questions

The issue tracker is intended for bugs found in the OpenReview UI. If your question is related to how OpenReview works please first check our [documentation](https://docs.openreview.net/). If you cannot find the answer there, please contact the organizers of your venue or [contact us](https://openreview.net/contact).

## Providing Feedback

Your comments and feedback are welcome! You can use OpenReview [discussions](https://github.com/openreview/openreview/discussions) page.

## Reporting Issues

If you have identified a reproducible problem in the OpenReview UI, we want to hear about it! Here's how you can make reporting your issue as effective as possible.

### Identify Where to Report

If you have found a security vulnerability in the system, instead of opening an issue, please contact us at <security@openreview.net>. We will investigate and do our best to quickly fix the problem.

If you have a problem with your account that requires you to share personal information such as your email or name, please [contact us](https://openreview.net/contact).

For all other types of bug feel free to open an issue in this repo to describe it as best as you can.

### Look For an Existing Issue

Before creating a new issue, please search the [open issues](https://github.com/openreview/openreview-web/issues) to see if a similar issue or feature request has already been filed.

If you find your issue already exists, make relevant comments and add your [reaction](https://github.com/blog/2119-add-reactions-to-pull-requests-issues-and-comments). Use a reaction in place of a "+1" comment (👍 for upvote and 👎 for downvote)

If you cannot find an existing issue that describes your bug or feature, create a new issue using the guidelines below.

### Writing Good Bug Reports and Feature Requests

File a single issue per problem or feature request. Do not enumerate multiple bugs or feature requests in the same issue.

Do not add your issue as a comment to an existing issue unless it's for the identical input. Many issues look similar, but have different causes.

The more information you can provide, the more likely someone will be successful at reproducing the issue and finding a fix.

Please include the following with each issue to the best of your abililty and leave blank the ones you don't have information for. The more information you provide the easier will it be for us to reproduce the issue and fix it.

- Version (if you know it)

- Operating system

- Browser and browser version

- Reproducible steps that trigger the issue

- What you expected to see, versus what you actually saw

- Images, animations, or a link to a video showing the issue occurring

- Any errors from the browser's developer console (opening the developer console varies depending on your browser)

## Development Setup

Please see the README file for step-by-step instructions on how to run openreview-web locally.

## Submitting Pull Requests

Once your branch and code changes are working locally make sure to run `npm run lint`, `npm run unitTest`, and `npm run test` to make sure all tests are passing.

Then open a PR against the master branch in this repo and the team will review your changes as soon as possible.

Please note that new features need to be discussed with the core team and the community first. If you're tackling a feature, please make sure it has been already discussed in an issue or in a [discussion](https://github.com/openreview/openreview/discussions).

Pull requests without an associated issue or discussion may still be merged, but we will focus on changes that have already been talked through.

## Thank You!

Your contributions and feedback to OpenReview allow us to deliver a better service to the community. Thank you for taking the time to contribute.
