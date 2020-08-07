/* globals $: false */
/* globals marked: false */
/* globals DOMPurify: false */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import LoadingSpinner from '../components/LoadingSpinner'
import Accordion from '../components/Accordion'

// Page Styles
import '../styles/pages/faq.less'

function Faq({ generalQuestions, pcQuestions, appContext }) {
  const [formattedGeneralQuestions, setFormattedGeneralQuestions] = useState(null)
  const [formattedPCQuestions, setFormattedPCQuestions] = useState(null)
  const router = useRouter()
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
      const $titleLink = $(`#questions .panel-title a[href="${window.location.hash}"]`).eq(0)
      if ($titleLink.length) {
        $titleLink.click()

        setTimeout(() => {
          const scrollPos = $titleLink.closest('.panel-default').offset().top - 55
          $('html, body').animate({ scrollTop: scrollPos }, 400)
        }, 200)
      }
    }

    // Update URL hash when clicking a question
    $('#questions .panel-title a').on('click', function onClick() {
      router.replace(window.location.pathname + window.location.search + $(this).attr('href'))
    })
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

          {formattedGeneralQuestions ? (
            <Accordion
              title="General Questions"
              sections={formattedGeneralQuestions}
              options={{ id: 'general-questions', collapsed: true, html: true }}
            />
          ) : (
            <LoadingSpinner />
          )}

          {formattedPCQuestions ? (
            <Accordion
              title="Program Chairs Questions"
              sections={formattedPCQuestions}
              options={{ id: 'pc-questions', collapsed: true, html: true }}
            />
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

When adding TeX content to a Markdown enabled field, it is important that all backslashes (\\) are escaped (i.e. replaced with \\\\) to prevent Markdown from stripping the backslashes before the TeX notation is parsed. If Markdown is not enabled, this is not necessary.

Keep in mind that your mathematics is part of an HTML document, so you need to be aware of the special characters used by HTML as part of its markup. There cannot be HTML tags within the math delimiters as TeX-formatted math does not include HTML tags. Make sure to add spaces around any \`<\` or \`>\` symbols to ensure they are not treated as open tags.`,
  }, {
    q: 'Why is my LaTeX code not displaying properly?',
    id: 'question-tex-not-displaying-properly',
    a: `One possible reason is that the macro is not supported by MathJax. If this is the case then macro will appear as plain red text in with the rendered TeX.

Another possibility is that the field has Markdown enabled, but not all the backslashes in the TeX notation were escaped. This can lead to some layout problems, such as all the elements of a matrix appearing in 1 row instead of many.

For more details on the difference between OpenReview's TeX support and other systems, see the answer above.`,
  }, {
    q: 'I couldn\'t find the answer to my question on this page. Where can I get more help?',
    id: 'question-more-help',
    a: `The best way to get help with a specific issue is to contact the program chairs or organizers of the venue you are participating in. Contact info can usually be found on the venue's OpenReview page.

For general iquiries, you can contact the OpenReview team by emailing [info@openreview.net](mailto:info@openreview.net) or use the feedback form linked in the footer below.`,
  }]

  const pcQuestions = [{
    q: 'How can I extend the submission deadline?',
    id: 'question-extend-submission-deadline',
    a: 'On the request form for your venue, click on the ‘Revision’ button and modify the Submission Deadline field to the new submission deadline.',
  }, {
    q: 'How can I add/remove fields to the submission form?',
    id: 'question-review-form-fields',
    a: '',
  }, {
    q: 'How can I make reviews visible to authors?',
    id: 'question-release-reviews-authors',
    a: 'On the request form for your venue, click on the ‘Review Stage’ button. Select Yes under Release Reviews to Authors and then submit. This will immediately release any existing reviews to authors and make subsequent posted reviews readily available to authors.',
  }, {
    q: 'How can I make reviews visible to reviewers?',
    id: 'question-release-reviews-reviewers',
    a: 'On the request form for your venue, click on the ‘Review Stage’ button. Reviews can be released to all reviewers, to only a paper\'s assigned reviewers, or to a paper\'s assigned reviewers who have already submitted their review.',
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
    a: 'To automaticall assign reviewers to papers after the submission deadline has passed, you must first set the review stage by clicking on the ‘Review Stage’ button on the request form for your venue. You will then be able to run the matcher by clicking on ‘Reviewers Paper Assignment’ under the ‘Overview’ tab in the PC console.',
  }, {
    q: 'How can I enable comments on papers?',
    id: 'question-enable-comments',
    a: '',
  }, {
    q: 'How can I contact the reviewers, area chairs or authors?',
    id: '',
    a: '',
  }, {
    q: 'Does OpenReview support supplementary material?',
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
    q: 'Is there a max size for files upload?',
    id: 'question-file-upload',
    a: '',
  }, {
    q: 'An author of a submission can not access their own paper, what is the problem?',
    id: 'question-author-permissions',
    a: 'If an author cannot access their own submission, they must make sure that the email address associated with the submission has been added to their profile and confirmed.',
  }, {
    q: 'How can I edit a submission after the deadline?',
    id: 'question-edit-submission-after-deadline',
    a: '',
  }, {
    q: 'Is it possible to make the submission public after the decisions are made?',
    id: 'question-release-submissions',
    a: '',
  }, {
    q: 'Can an author withdraw a rejected paper?',
    id: 'question-withdraw-paper',
    a: '',
  }, {
    q: 'How can I enable the camera-ready revision upload for the accepted papers?',
    id: 'question-camera-ready-revision',
    a: 'On the request form for your venue, click on the ‘Submission Revision Stage’ button.',
  }, {
    q: 'How can I remove/modify an email/name from my Profile?',
    id: '',
    a: '',
  }, {
    q: 'Which field types are supported in the forms?',
    id: 'question-field-type-supported',
    a: `Each field can support the following properties, all the properties are optional expect the field type:
- field type
- description
- order
- required
- default

You can have different types of fields:
- **value**, **values**: string or array of strings, the value/s can not be modified by the user.

    \`\`\`
    "title": {
      "value": "this is a static value"
    },
    "keywords": {
      "values": ["Deep Learning", "Machine Learning"]
    }
    \`\`\`
- **value-regex**, **values-regex**: string or array of strings, the value should pass the regex validation.

    \`\`\`
    "title": {
      "order": 0,
      "value-regex": ".{1,500}",
      "description": "Brief summary of your comment.",
      "required": true
    },
    "emails": {
      "description": "Comma separated list of author email addresses, lowercased, in the same order as above. For authors with existing OpenReview accounts, please make sure that the provided email address(es) match those listed in the author\\'s profile.",
      "order": 3,
      "values-regex": "([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})",
      "required":true
    }
    \`\`\`

to be continue....
    `,
  }, {
    q: 'Which are the default submission, review and comment forms?',
    id: 'question-default-forms',
    a: `These are the field required for each form:
- **Submission form**, please note that title, authors and authorids should be always present in the submission form.

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

![Submission form image](/images/faq-submission-form.png)

to be continue....
    `,
  }]

  return {
    props: { generalQuestions, pcQuestions },
  }
}

Faq.bodyClass = 'faq'

export default Faq
