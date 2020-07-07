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

function Faq({ questions, appContext }) {
  const [formattedQuestions, setFormattedQuestions] = useState(null)
  const router = useRouter()
  const { clientJsLoading } = appContext

  useEffect(() => {
    if (clientJsLoading) return

    const defaultRenderer = new marked.Renderer()
    setFormattedQuestions(questions.map(obj => ({
      id: obj.id,
      heading: obj.q,
      body: DOMPurify.sanitize(marked(obj.a, { renderer: defaultRenderer })),
    })))
  }, [clientJsLoading])

  useEffect(() => {
    if ($('#questions').length === 0) return

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
      router.push(window.location.pathname + window.location.search + $(this).attr('href'))
    })
  }, [formattedQuestions])

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

          {formattedQuestions ? (
            <Accordion
              sections={formattedQuestions}
              options={{ id: 'questions', collapsed: true, html: true }}
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
  const questions = [{
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

  return {
    props: { questions },
  }
}

Faq.bodyClass = 'faq'

export default Faq
