import { getNoteReaderValues } from '../components/NoteEditor'

const roleNames = {
  anonAreaChairName: 'Area_Chair_',
  anonReviewerName: 'Reviewer_',
  areaChairName: 'Area_Chairs',
  reviewerName: 'Reviewers',
  secondaryAreaChairName: undefined,
}

describe('NoteEditor', () => {
  test('return correct reader value in getNoteReaderValues', () => {
    const invitation = {
      edit: {
        note: {
          signatures: ['${3/signatures}'],
          readers: {
            param: {
              items: [
                { value: 'NeurIPS.cc/2025/Conference/Program_Chairs', optional: false },
                {
                  value: 'NeurIPS.cc/2025/Conference/Submission1/Senior_Area_Chairs',
                  optional: false,
                },
                {
                  value: 'NeurIPS.cc/2025/Conference/Submission1/Area_Chairs',
                  optional: true,
                },
                { value: 'NeurIPS.cc/2025/Conference/Submission1/Reviewers', optional: true },
                {
                  inGroup: 'NeurIPS.cc/2025/Conference/Submission1/Reviewers',
                  optional: true,
                },
              ],
            },
          },
        },
      },
    }

    // user selection
    const noteEditorData = {
      editSignatureInputValues: ['NeurIPS.cc/2025/Conference/Submission1/Reviewer_abcd'],
      noteReaderValues: [
        'NeurIPS.cc/2025/Conference/Program_Chairs',
        'NeurIPS.cc/2025/Conference/Submission1/Senior_Area_Chairs',
        'NeurIPS.cc/2025/Conference/Submission1/Area_Chairs',
      ],
    }

    const readerValue = getNoteReaderValues(roleNames, invitation, noteEditorData)
    // signature should be added and reviewers group should not be added
    const expectedReaderValue = [
      'NeurIPS.cc/2025/Conference/Program_Chairs',
      'NeurIPS.cc/2025/Conference/Submission1/Senior_Area_Chairs',
      'NeurIPS.cc/2025/Conference/Submission1/Area_Chairs',
      'NeurIPS.cc/2025/Conference/Submission1/Reviewer_abcd',
    ]
    expect(readerValue).toEqual(expectedReaderValue)
  })
})
