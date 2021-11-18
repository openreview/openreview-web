const titleInstructionMap = {
  educationHistory: {
    title: 'Education & Career History',
    renderInstruction: () => (
      <>
        Enter your education and career history.
        The institution domain is used for conflict of interest detection,
        author deduplication, analysis of career path history, and tallies of institutional diversity.
        For ongoing positions, leave the End field blank.
      </>
    ),
  },
  emails: {
    title: 'Emails',
    renderInstruction: () => (
      <>
        Enter all email addresses associated with your current and historical institutional affiliations,
        your previous publications, and any other related systems, such as TPMS, CMT, and ArXiv.
        {' '}
        <strong>
          Email addresses associated with your old affiliations
          (including previous employers) should not be deleted.
        </strong>
        {' '}
        This information is crucial for deduplicating users and ensuring that you see your reviewing assignments.
        OpenReview will only send messages to the address marked as “Preferred”.
      </>
    ),
  },
  expertise: {
    title: 'Expertise',
    renderInstruction: () => (
      <>
        For each line, enter comma-separated keyphrases representing an intersection of your interests.
        {' '}
        Think of each line as a query for papers in which you would have expertise and interest. For example:
        <br />
        <em>topic models, social network analysis, computational social science</em>
        <br />
        <em>deep learning, RNNs, dependency parsing</em>
      </>
    ),
  },
  gender: {
    title: 'Gender',
    renderInstruction: () => (
      <>This information helps conferences better understand their gender diversity. (Optional)</>
    ),
  },
  importedPublications: {
    title: 'Imported Publications',
    renderInstruction: () => (
      <>
        Below is a list of publications imported from DBLP and other sources that include you as an author.
        {' '}
        To remove any publications of which you are not actually an author of, click the minus sign next to the title.
      </>
    ),
  },
  names: {
    title: 'Names',
    renderInstruction: () => (
      <>
        {/* eslint-disable-next-line max-len */}
        Enter your full name (first, middle, last). Also add any other names you have used in the past when authoring papers.
      </>
    ),
  },
  personalLinks: {
    title: 'Personal Links',
    renderInstruction: () => (
      <>
        Enter full URLs of your public profiles on other sites. All URLs should begin with http or https.
      </>
    ),
  },
  relation: {
    title: 'Advisors & Other Relations',
    renderInstruction: () => (
      <>
        Enter all advisors, co-workers, and other people that should be included when detecting conflicts of interest.
      </>
    ),
  },
}

const ProfileSectionHeader = ({ type }) => (
  <>
    <h4>{titleInstructionMap[type].title}</h4>
    <p className="instructions">
      {titleInstructionMap[type].renderInstruction()}
    </p>
  </>
)
export default ProfileSectionHeader
