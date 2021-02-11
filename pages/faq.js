/* globals $: false */
/* globals marked: false */
/* globals DOMPurify: false */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import LoadingSpinner from '../components/LoadingSpinner'
import Accordion from '../components/Accordion'

// Page Styles
import '../styles/pages/faq.less'

function Faq({ generalQuestions, pcQuestions, appContext }) {
  const [formattedGeneralQuestions, setFormattedGeneralQuestions] = useState(null)
  const [formattedPCQuestions, setFormattedPCQuestions] = useState(null)
  const { clientJsLoading } = appContext

  useEffect(() => {
    if (clientJsLoading) return

                  const defaultRenderer = new marked.Renderer()

    setFormattedGeneralQuestions(generalQuestions.map(obj => ({
      id: obj.id,
      heading: obj.q,
      body: DOMPurify.sanitize(marked(obj.a, { renderer: defaultRenderer })),
    })))
    setFormattedPCQuestions(pcQuestions.map(obj => ({
      id: obj.id,
      heading: obj.q,
      body: DOMPurify.sanitize(marked(obj.a, { renderer: defaultRenderer })),
    })))
  }, [clientJsLoading])

  useEffect(() => {
    if (!formattedGeneralQuestions || !formattedPCQuestions) return

    // Scroll to and expand question referenced in URL
    if (window.location.hash) {
      const $titleLink = $(`.panel-title a[href="${window.location.hash}"]`).eq(0)
      if ($titleLink.length) {
        $titleLink.trigger('click')

        setTimeout(() => {
          const scrollPos = $titleLink.closest('.panel-default').offset().top - 55
          $('html, body').animate({ scrollTop: scrollPos }, 400)
        }, 200)
      }
    }
  }, [formattedGeneralQuestions, formattedPCQuestions])

  return (
    <div>
      <Head>
        <title key="title">Frequently Asked Questions | OpenReview</title>
      </Head>

      <div className="row">
        <div className="col-xs-12 col-md-10 col-md-offset-1 faq-header">
          <h1>Frequently Asked Questions</h1>
        </div>
      </div>

      <div className="row">
        <div className="col-xs-12 col-md-10 col-md-offset-1 faq-container">

          {(formattedGeneralQuestions && formattedPCQuestions) ? (
            <>
              <h3>General Questions</h3>
              <Accordion
                sections={formattedGeneralQuestions}
                options={{ id: 'general-questions', collapsed: true, html: true }}
              />

              <h3>Program Chair Questions</h3>
              <Accordion
                sections={formattedPCQuestions}
                options={{ id: 'pc-questions', collapsed: true, html: true }}
              />
            </>
          ) : (
            <LoadingSpinner />
          )}

        </div>
      </div>

    </div>
  )
}

export async function getStaticProps() {
  // TODO: get this content from database or CMS
  const generalQuestions = [{
    q: 'How do I add formatting to my reviews or comments?',
    id: 'question-add-formatting',
    a: `Venues can choose to allow users to add basic formatting to text content by enabling Markdown in specific places like official reviews and rebuttals. Markdown is a plain text format for writing structured documents, based on common conventions for indicating formatting and is currently used by many prominent websites including GitHub and StackOverflow. It can be used to add headings, bold, italics, lists, tables, and more. For a brief overview of the features of Markdown see [CommonMark.org’s reference](https://commonmark.org/help/). OpenReview follows the [CommonMark spec](https://spec.commonmark.org/0.29/), with the exception of images and inline HTML which are not supported.

If Markdown is enabled, you will see that the text input has two tabs at the top: Write and Preview. This feature allows you to enter plain text in the Write tab and quickly see what the HTML output will look on the page in the Preview tab.

If Markdown formatting has not been enabled by the venue, you can still format your text using regular line breaks and spaces for indentation.`,
  }, {
    q: 'How do I add formulas or mathematical notation to my submission or comment?',
    id: 'question-add-formulas',
    a: `OpenReview supports TeX and LaTeX notation in many places throughout the site, including forum comments and reviews, paper abstracts, and venue homepages. To indicate that some piece of text should be rendered as TeX, use the delimiters \`$...$\` for inline math or \`$$...$$\` for displayed math.
For example, this raw text:
\`\`\`
This is what the Pythagorean theorem $x^2 + y^2 = z^2$ looks like.

Here is an example of multiple integrals:

$$
\\iiiint_V \\mu(t,u,v,w) \\,dt\\,du\\,dv\\,dw
$$
\`\`\`
will be displayed as:

![MathJax example image](/images/faq-mathjax-example.png)

For more information on LaTeX notation we recommend [Overleaf's Guide](https://www.overleaf.com/learn/latex/Mathematical_expressions).`,
  }, {
    q: 'How does OpenReview\'s TeX support differ from "real" TeX/LaTeX systems?',
    id: 'question-tex-differences',
    a: `OpenReview uses the open source library [MathJax](https://docs.mathjax.org/en/latest/index.html) to render TeX content, and there are some key differences between it and other systems. First and foremost, the TeX input processor implements only the math-mode macros of TeX and LaTeX, not the text-mode macros. So, for example, MathJax does not implement \`\\emph\` or \`\\begin{enumerate}...\\end{enumerate}\` or other text-mode macros or environments. You must use Markdown (if enabled) to handle such formatting tasks.

Second, some features in MathJax might be limited. For example, MathJax only implements a limited subset of the array environment’s preamble; i.e., only the l, r, c, and | characters alongside : for dashed lines — everything else is ignored.

When adding TeX content to a Markdown enabled field, it is important that all backslashes (\\\\) are escaped (i.e. replaced with \\\\\\\\) to prevent Markdown from stripping the backslashes before the TeX notation is parsed. If Markdown is not enabled, this is not necessary.

Keep in mind that your mathematics is part of an HTML document, so you need to be aware of the special characters used by HTML as part of its markup. There cannot be HTML tags within the math delimiters as TeX-formatted math does not include HTML tags. Make sure to add spaces around any \`<\` or \`>\` symbols to ensure they are not treated as open tags.`,
  }, {
    q: 'Why is my LaTeX code not displaying properly?',
    id: 'question-tex-not-displaying-properly',
    a: `One possible reason is that the macro is not supported by MathJax. If this is the case then macro will appear as plain red text in with the rendered TeX.

Another possibility is that the field has Markdown enabled, but not all the backslashes in the TeX notation were escaped. This can lead to some layout problems, such as all the elements of a matrix appearing in 1 row instead of many.

For more details on the difference between OpenReview's TeX support and other systems, see the answer above.`,
  }, {
    q: 'How can I remove/modify an email/name from my profile?',
    id: 'question-remove-email',
    a: `To remove an email that has not been confirmed, go to your profile and click on ‘Edit Profile’. Confirmed emails cannot be removed from your profile, since these are used in conflict detection and paper coreference.

  If your profile contains a confirmed email or a name that does not belong to you, please contact the OpenReview team by emailing info@openreview.net.`,
  }, {
    q: 'How do I import my papers from DBLP?',
    id: 'question-dblp-import',
    a: `To add existing DBLP publications to your OpenReview profile:

  1. **Login to OpenReview**<br/>
  You can click on the "Login" on the right of navigation menu to login to OpenReview.


  2. **Go to edit mode of your profile page**<br/>
  Click on your name on the right of navigation menu and click on "Profile" link in the dropdown displayed.
  <img src="/images/faq-dblp-profile.png" alt="go to profile page" class="img-answer"/><br/>

  When you are directed to the profile page, click on the "Edit Profile" button in the ribbon displayed under the navigation bar.
  <img src="/images/faq-dblp-edit-profile.png" alt="go to edit mode" class="img-answer"/><br/>


  3. **Add DBLP URL**<br/>
  Look for "DBLP URL" text input under "Personal Links" section and enter the "Persistent DBLP URL".
  <img src="/images/faq-dblp-input.png" alt="dblp url input" class="img-answer"/><br/>

  You can get the "Persistent DBLP URL" from your DBLP homepage.

  To do so, hover over the <img src="/images/share_alt.svg" alt="share" class="share" /> icon to the right of your name in DBLP page heading and copy the persistent URL from the hover menu.
  <img src="/images/faq-dblp.png" alt="dblp website" class="img-answer"/><br/>

  You can then go to your OpenReview profile page, click "Edit Profile", paste your persistent DBLP URL to the corresponding input.


  4. **Click "Add DBLP Papers to Profile" button**<br/>
  Valid DBLP URL will enable the "Add DBLP Papers to Profile" button. Click the button and your DBLP publications will be listed in a modal window.


  5. **Select the papers to upload**<br/>
  Use the checkbox in front of each paper to select the papers which you would like to import to your OpenReview profile.


  6. **Click "Add to Your Profile" button**<br/>
  Click the "Add to Your Profile" button at the bottom of the modal window to import selected papers.
  <img src="/images/faq-dblp-import.png" alt="import papers" class="img-answer"/><br/>

If you get an error that says "please ensure the provided DBLP URL is yours", please ensure that name (or one of the names) in your OpenReview profile **matches exactly** with the name used in DBLP publications.
You can add a matching name to your OpenReview profile by clicking the plus icon in "Names" section of the profile edit page, saving your profile by clicking the "Save Profile Changes" button at the bottom of profile edit page and try importing again.`,
  }, {
    q: 'I couldn\'t find the answer to my question on this page. Where can I get more help?',
    id: 'question-more-help',
    a: `The best way to get help with a specific issue is to contact the program chairs or organizers of the venue you are participating in. Contact info can usually be found on the venue's OpenReview page.

For general inquiries, you can contact the OpenReview team by emailing [info@openreview.net](mailto:info@openreview.net) or use the feedback form linked in the footer below.`,
  }]

  const pcQuestions = [{
    q: 'How can I access the request form for my venue?',
    id: 'question-request-form',
    a: `You can access the request form for your venue in one of three ways:
- Follow the link that was sent to your email when the request was posted.
- Go to the venue request page [here](https://openreview.net/group?id=OpenReview.net/Support) and click on your submitted request.
- Under the ‘Overview’ tab in the PC console, click on ‘Full Venue Configuration’.`,
  }, {
    q: 'How can I override the information displayed on my venue\'s homepage?',
    id: 'question-homepage-override',
    a: `On the request form for your venue, click on the ‘Revision’ button and modify the Homepage Override field, which expects a valid JSON.

The instruction field of the JSON accepts HTML, allowing the formatting of the instructions section to be fully customized. All HTML should be validated to ensure that it will not break the layout of the page: https://validator.w3.org/#validate_by_input

Example:
\`\`\`
{
  "title": "tinyML 2021",
  "subtitle": "First International Research Symposium on Tiny Machine Learning (tinyML)",
  "location": "Burlingame, CA",
  "deadline": "Submission Deadline: November 30, 2020 11:59pm AOE",
  "website": "https://tinyml.org/home/index.html",
  "instructions": "<h1>Important Dates</h1><li>Submission Deadline: November <strike>23</strike> 30, 2020 11:59pm AOE <b>(extended)</b></li><li>Author Notification: Jan 15th, 2021</li><li>Camera Ready: Feb 15th, 2021</li></br><h1>Submission Format</h1><li>Page limit is 6 to 8 pages, including references and any appendix material</li><li>Submissions must be blind for the double-blind review process</li><li>For paper formatting, please use the <a href=\\"https://www.acm.org/publications/proceedings-template\\">ACM SIGCONF template</a>.</li></br>"
}
\`\`\`
which will be displayed as:

![homepage](/images/faq-homepage-override.png)`,
  }, {
    q: 'How can I recruit reviewers for my venue?',
    id: 'question-recruitment',
    a: 'On the request form for your venue, click on the ‘Recruitment’ button to recruit reviewers (and ACs if applicable).',
  }, {
    q: 'How can I remind invited reviewers for my venue?',
    id: 'question-remind-recruitment',
    a: 'On the request form for your venue, click on the ‘Remind’ button to remind invited reviewers (and ACs if applicable). This will send an email to all invited reviewers (or ACs) that haven\'t replied to the invitation.',
  }, {
    q: 'How can I extend the submission deadline?',
    id: 'question-extend-submission-deadline',
    a: 'On the request form for your venue, click on the ‘Revision’ button and modify the Submission Deadline field to the new submission deadline.',
  }, {
    q: 'How do I add/remove fields to the submission form?',
    id: 'question-review-form-fields',
    a: `On the request form for your venue, click on the ‘Revision’ button. Under Additional Submission Options, add a JSON with any extra fields you want to appear on the submission form. To remove fields, select the fields to remove under Remove Submission Options.

  For more information on supported field types, [click here.](/faq#question-field-type-supported)`,
  }, {
    q: 'How do I make reviews visible to authors?',
    id: 'question-release-reviews-authors',
    a: 'On the request form for your venue, click on the ‘Review Stage’ button. Select Yes under Release Reviews to Authors and then submit. This will immediately release any existing reviews to authors and make subsequent posted reviews readily available to authors.',
  }, {
    q: 'How do I make reviews visible to reviewers?',
    id: 'question-release-reviews-reviewers',
    a: 'On the request form for your venue, click on the ‘Review Stage’ button. Reviews can be released to all reviewers, to a paper\'s assigned reviewers, or to a paper\'s assigned reviewers who have already submitted their review.',
  }, {
    q: 'How do I get email addresses of accepted/all papers authors?',
    id: 'question-getting-author-emails',
    a: 'Please refer to the section on obtaining data in the documentation for our [Python API](https://openreview-py.readthedocs.io/en/latest/)',
  }, {
    q: 'How can I manually assign reviewers to papers?',
    id: 'question-manually-assign-reviewers',
    a: 'To manually assign reviewers to papers after the submission deadline has passed, you must first set the review stage by clicking on the ‘Review Stage’ button on the request form for your venue. You will then be able to assign reviewers to papers under the ‘Paper Status’ tab in the PC console.',
  }, {
    q: 'How can I automatically assign reviewers to papers based on their affinity and/or bids?',
    id: 'question-run-matcher',
    a: 'To automatically assign reviewers to papers after the submission deadline has passed, you must first set the review stage by clicking on the ‘Review Stage’ button on the request form for your venue. You will then be able to run the matcher by clicking on ‘Reviewers Paper Assignment’ under the ‘Overview’ tab in the PC console.',
  }, {
    q: 'How can I enable comments on papers?',
    id: 'question-enable-comments',
    a: 'On the request from for your venue, click on the ‘Comment Stage’ button to set up confidential comments and/or public comments.',
  }, {
    q: 'How can I contact the reviewers, area chairs or authors?',
    id: 'question-contact-venue-roles',
    a: 'Under the ‘Overview’ tab of the PC console for your venue, you will find a ‘Venue Roles’ section. Clicking on any of the links will take you to the respective group. On this page, you have the option to email selected members of the group.',
  }, {
    q: 'Does OpenReview support supplementary materials for submissions?',
    id: 'question-supplementary-material',
    a: `Yes, OpenReview supports supplementary material.

  You can add supplementary material to the submission form by clicking on the 'Revision' button and adding the following JSON under Additional Submission Options:
  \`\`\`
  {
    "supplementary_material": {
      "description": "Supplementary material (e.g. code or video). All supplementary material must be self-contained and zipped into a single file.",
      "order": 10,
      "value-file": {
          "fileTypes": [
              "zip"
          ],
          "size": 50
      },
      "required": false
    }
  }
  \`\`\`

  This will add a supplementary material field to upload zipped files of size up to 50 MB.`,
  }, {
    q: 'Is there a max file size for uploads?',
    id: 'question-file-upload',
    a: 'Yes, the maximum file size for all uploads is 100MB.',
  }, {
    q: 'An author of a submission cannot access their own paper, what is the problem?',
    id: 'question-author-permissions',
    a: 'If an author cannot access their own submission, they must make sure that the email address associated with the submission has been added to their profile and confirmed.',
  }, {
    q: 'How can I edit a submission after the deadline?',
    id: 'question-edit-submission-after-deadline',
    a: 'To edit a submission after the deadline, go to the forum of the paper you wish to edit and click on the edit button. Similarly, you can use the trash button to delete the submission.',
  }, {
    q: 'How do I make submissions public after the decisions are made?',
    id: 'question-release-submissions',
    a: 'Once decisions have been posted, you will see a ‘Post Decision Stage’ button on the request form for your venue. Click on this button to choose between releasing all papers or only accepted papers to the public.',
  }, {
    q: 'How do I release the identities of the authors of the accepted papers only?',
    id: 'question-release-author-names',
    a: 'Once decisions have been posted, you will see a ‘Post Decision Stage’ button on the request form for your venue. Click on this button to choose between revealing identities of authors of all papers or only accepted papers to the public.',
  }, {
    q: 'How do I modify the homepage layout to show decision tabs?',
    id: 'question-homepage-layout',
    a: `Once decisions have been posted, you will see a ‘Post Decision Stage’ button on the request form for your venue. Once you click on this button, you will be able to specify the name of each tab you want to include in the homepage in the form of a dictionary.

  Note that each key must be a valid decision option. For example, a venue with the decision options Accept (Oral), Accept (Spotlight), Accept (Poster) and Reject could choose to hide the rejected papers tab as follows:
  \`\`\`
  {
    "Accept (Oral)": "Accepted Oral submissions",
    "Accept (Spotlight)": "Accepted Spotlight submissions",
    "Accept (Poster)": "Accepted Poster submissions"
  }
  \`\`\``,
  }, {
    q: 'How do I contact the authors of the accepted papers only?',
    id: 'question-contact-authors-accepted',
    a: 'Under the ‘Overview’ tab of the PC console for your venue, you will find a ‘Venue Roles’ section. Click on the ‘Accepted’ link next to ‘Authors’ to be taken to the respective group. On this page, you have the option to email members of the group.',
  }, {
    q: 'Can an author withdraw a rejected paper?',
    id: 'question-withdraw-paper',
    a: `Yes, authors are able to withdraw their paper at any time during the review process. Similarly, PCs can desk-reject papers at any time during the review process.

On the request form for your venue, you can configure the visibility of withdrawn and desk-rejected papers, as well as the identities of their authors.`,
  }, {
    q: 'How can I enable the camera-ready revision upload for the accepted papers?',
    id: 'question-camera-ready-revision',
    a: 'On the request form for your venue, click on the ‘Submission Revision Stage’ button to set up camera-ready revisions for papers.',
  }, {
    q: 'What field types are supported in the forms?',
    id: 'question-field-type-supported',
    a: `Each field must be a valid JSON with a title and the following optional properties (with the exception of field type, which is required):
- field type: the type of the field, which includes *value(s)*, *value(s)-regex*, *value-radio*, *value(s)-checkbox*, *value(s)-dropdown*, *value-file*
- description: a string describing how users should fill this field
- order: a number representing the position in which the field will appear on the form
- required: a boolean representing whether the field is required (true) or optional (false)
- default: the default value of the field
-markdown: a boolean representing whether Markdown is enabled for the field (only valid for *value-regex* field type)

You can have different types of fields:
- **value**, **values**: string or array of strings; the value(s) cannot be modified by the user.

    \`\`\`
    "title": {
      "value": "this is a static value"
    },
    "keywords": {
      "values": ["Deep Learning", "Machine Learning"]
    }
    \`\`\`

- **value-regex**, **values-regex**: string or array of strings; the value entered by the user should pass the regex validation.

    \`\`\`
    "comment": {
      "order": 0,
      "value-regex": ".{1,500}",
      "description": "Brief summary of your comment.",
      "required": true,
      "markdown": true
    },
    "emails": {
      "description": "Comma separated list of author email addresses, lowercased, in the same order as above. For authors with existing OpenReview accounts, please make sure that the provided email address(es) match those listed in the author's profile.",
      "order": 3,
      "values-regex": "([a-z0-9_\\\\-\\\\.]{1,}@[a-z0-9_\\\\-\\\\.]{2,}\\\\.[a-z]{2,},){0,}([a-z0-9_\\\\-\\\\.]{1,}@[a-z0-9_\\\\-\\\\.]{2,}\\\\.[a-z]{2,})",
      "required": true
    }
    \`\`\`

- **value-radio**: string or array of strings; the user can only choose one option.

    \`\`\`
    "confirmation": {
      "description": "Please confirm you have read the workshop's policies.",
      "value-radio": [
          "I have read and agree with the workshop's policy on behalf of myself and my co-authors."
      ],
      "order": 2,
      "required": true
    },
    "soundness": {
      "description": "Indicate your agreement with the following: This paper is technically sound.",
      "value-radio": [
          "Agree",
          "Neutral",
          "Disagree"
      ],
      "order": 3,
      "required": true
    }
    \`\`\`

- **value-checkbox**, **values-checkbox**: string or array of strings; the user can select one or more options.

    \`\`\`
    "profile_confirmed": {
      "description": "Please confirm that your OpenReview profile is up-to-date by selecting 'Yes'.",
      "value-checkbox": "Yes",
      "required": true,
      "order": 1
    },
    "keywords": {
      "description": "Please check all keywords that apply.",
        "values-checkbox": [
          "Deep Learning",
          "Machine Learning",
          "Computer Vision",
          "Database Design"
        ],
        "required": true,
        "order": 3
    }
    \`\`\`

- **value-dropdown**, **values-dropdown**: array of strings; the user can select one or more options from a dropdown.

    \`\`\`
    "novelty": {
      "order": 2,
      "value-dropdown": ["Very High", "High", "Neutral", "Low", "Very Low"],
      "description": "Indicate your agreement with the following: This paper is highly novel.",
      "required": true
    },
    "keywords": {
      "order" : 5,
      "description" : "Select or type subject area",
      "values-dropdown": [
        "Computer Vision Theory",
        "Dataset and Evaluation",
        "Human Computer Interaction",
        "Machine Learning",
        "Unsupervised Learning"
      ],
      "required": true
    }
    \`\`\`

- **value-file**: a valid JSON specifying the expected upload file type and size in MB; the user can upload one file.

  The *fileTypes* field expects an array of strings specifying the permitted file types that the user can upload. Supported field types are pdf, csv, zip and mp4.

    \`\`\`
    "pdf": {
      "description": "Upload a single PDF file or a single mp4 file.",
      "order": 6,
      "value-file": {
          "fileTypes": ["pdf", "mp4"],
          "size": 50
      },
      "required":true
    }
    \`\`\``

    ,
  }, {
    q: 'What do the default submission, review, metareview, comment and decision forms look like?',
    id: 'question-default-forms',
    a: `These are the default fields for each form:
- **Submission form**, please note that title, authors and authorids should always be present in the submission form.

    \`\`\`
    {
      "title": {
        "description": "Title of paper. Add TeX formulas using the following formats: $In-line Formula$ or $$Block Formula$$",
        "order": 1,
        "value-regex": ".{1,250}",
        "required": true
      },
      "authors": {
          "description": "Comma separated list of author names.",
          "order": 2,
          "values-regex": "[^;,\\n]+(,[^,\\n]+)*",
          "required": true
      },
      "authorids": {
          "description": "Comma separated list of author email addresses, lowercased, in the same order as above. For authors with existing OpenReview accounts, please make sure that the provided email address(es) match those listed in the author's profile.",
          "order": 3,
          "values-regex": "([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})",
          "required": true
      },
      "keywords": {
          "description": "Comma separated list of keywords.",
          "order": 6,
          "values-regex": "(^$)|[^;,\\n]+(,[^,\\n]+)*"
      },
      "TL;DR": {
          "description": "\\"Too Long; Didn't Read\\": a short sentence describing your paper",
          "order": 7,
          "value-regex": "[^\\n]{0,250}",
          "required": false
      },
      "abstract": {
          "description": "Abstract of paper. Add TeX formulas using the following formats: $In-line Formula$ or $$Block Formula$$",
          "order": 8,
          "value-regex": "[\\S\\s]{1,5000}",
          "required": true
      },
      "pdf": {
          "description": "Upload a PDF file that ends with .pdf",
          "order": 9,
          "value-file": {
              "fileTypes": [
                  "pdf"
              ],
              "size": 50000000
          },
          "required": true
      }
    }
    \`\`\`

    will be displayed as:

    ![Submission](/images/faq-submission-form.png)

- **Review form**

    \`\`\`
    {
      "title": {
          "order": 1,
          "value-regex": ".{0,500}",
          "description": "Brief summary of your review.",
          "required": true
      },
      "review": {
          "order": 2,
          "value-regex": "[\\S\\s]{1,200000}",
          "description": "Please provide an evaluation of the quality, clarity, originality and significance of this work, including a list of its pros and cons (max 200000 characters). Add formatting using Markdown and formulas using LaTeX. For more information see https://openreview.net/faq",
          "required": true,
          "markdown": true
      },
      "rating": {
          "order": 3,
          "value-dropdown": [
              "10: Top 5% of accepted papers, seminal paper",
              "9: Top 15% of accepted papers, strong accept",
              "8: Top 50% of accepted papers, clear accept",
              "7: Good paper, accept",
              "6: Marginally above acceptance threshold",
              "5: Marginally below acceptance threshold",
              "4: Ok but not good enough - rejection",
              "3: Clear rejection",
              "2: Strong rejection",
              "1: Trivial or wrong"
          ],
          "required": true
      },
      "confidence": {
          "order": 4,
          "value-radio": [
              "5: The reviewer is absolutely certain that the evaluation is correct and very familiar with the relevant literature",
              "4: The reviewer is confident but not absolutely certain that the evaluation is correct",
              "3: The reviewer is fairly confident that the evaluation is correct",
              "2: The reviewer is willing to defend the evaluation, but it is quite likely that the reviewer did not understand central parts of the paper",
              "1: The reviewer's evaluation is an educated guess"
          ],
          "required": true
      }
    }
    \`\`\`

    will be displayed as:

    ![Review](/images/faq-review-form.png)

- **Metareview form**

    \`\`\`
    {
      "metareview": {
          "order": 1,
          "value-regex": "[\\S\\s]{1,5000}",
          "description": "Please provide an evaluation of the quality, clarity, originality and significance of this work, including a list of its pros and cons. Your comment or reply (max 5000 characters). Add formatting using Markdown and formulas using LaTeX. For more information see https://openreview.net/faq",
          "required": true,
          "markdown": true
      },
      "recommendation": {
          "order": 2,
          "value-dropdown": [
              "Accept (Oral)",
              "Accept (Poster)",
              "Reject"
          ],
          "required": true
      },
      "confidence": {
          "order": 3,
          "value-radio": [
              "5: The area chair is absolutely certain",
              "4: The area chair is confident but not absolutely certain",
              "3: The area chair is somewhat confident",
              "2: The area chair is not sure",
              "1: The area chair's evaluation is an educated guess"
          ],
          "required": true
      }
    }
    \`\`\`

    will be displayed as:

    ![Metareview](/images/faq-metareview-form.png)

- **Comment form**

    \`\`\`
    {
      "title": {
          "order": 0,
          "value-regex": ".{1,500}",
          "description": "Brief summary of your comment.",
          "required": true
      },
      "comment": {
          "order": 1,
          "value-regex": "[\\S\\s]{1,5000}",
          "description": "Your comment or reply (max 5000 characters). Add formatting using Markdown and formulas using LaTeX. For more information see https://openreview.net/faq",
          "required": true,
          "markdown": true
      }
    }
    \`\`\`

    will be displayed as:

    ![Comment](/images/faq-comment-form.png)

- **Decision form**

    \`\`\`
    {
      "title": {
          "order": 1,
          "required": true,
          "value": "Paper Decision"
      },
      "decision": {
          "order": 2,
          "required": true,
          "value-radio": [
              "Accept (Oral)",
              "Accept (Poster)",
              "Reject"
          ],
          "description": "Decision"
      },
      "comment": {
          "order": 3,
          "required": false,
          "value-regex": "[\\S\\s]{0,5000}",
          "description": ""
      }
    }
    \`\`\`

    will be displayed as:

    ![Decision](/images/faq-decision-form.png)`,
  }]

  return {
    props: { generalQuestions, pcQuestions },
  }
}

Faq.bodyClass = 'faq'

export default Faq
