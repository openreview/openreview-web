import { getNoteReaderValues } from '../components/NoteEditor'
import api from '../lib/api-client'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

const roleNames = {
  anonAreaChairName: 'Area_Chair_',
  anonReviewerName: 'Reviewer_',
  areaChairName: 'Area_Chairs',
  reviewerName: 'Reviewers',
  secondaryAreaChairName: undefined,
}

beforeEach(() => {
  api.get = jest.fn()
})

describe('NoteEditor', () => {
  test('return correct reader value in getNoteReaderValues', async () => {
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

    api.get = jest.fn(() =>
      Promise.resolve({
        groups: [
          {
            id: 'NeurIPS.cc/2025/Conference/Submission1/Reviewers',
            members: [
              'NeurIPS.cc/2025/Conference/Submission1/Reviewer_abcd',
              'NeurIPS.cc/2025/Conference/Submission1/Reviewer_efgh',
              'NeurIPS.cc/2025/Conference/Submission1/Reviewer_ijkl',
              'NeurIPS.cc/2025/Conference/Submission1/Reviewer_mnop',
            ],
          },
        ],
      })
    )

    const readerValue = await getNoteReaderValues(
      roleNames,
      invitation,
      noteEditorData,
      'token'
    )

    expect(api.get).toHaveBeenCalledWith(
      '/groups',
      {
        id: 'NeurIPS.cc/2025/Conference/Submission1/Reviewers',
      },
      expect.anything()
    )
    // signature should be added and reviewers group should not be added
    const expectedReaderValue = [
      'NeurIPS.cc/2025/Conference/Program_Chairs',
      'NeurIPS.cc/2025/Conference/Submission1/Senior_Area_Chairs',
      'NeurIPS.cc/2025/Conference/Submission1/Area_Chairs',
      'NeurIPS.cc/2025/Conference/Submission1/Reviewer_abcd',
    ]
    expect(readerValue).toEqual(expectedReaderValue)
  })

  test('return correct reader value in getNoteReaderValues (AC and anon AC)', async () => {
    // invitation has both all ACs group and anon AC groups, only add anon AC group
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
                  value: 'NeurIPS.cc/2025/Conference/Submission1/Area_Chairs', // all ACs group
                  optional: true,
                },
                {
                  inGroup: 'NeurIPS.cc/2025/Conference/Submission1/Area_Chairs', // Anon AC groups
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
      editSignatureInputValues: ['NeurIPS.cc/2025/Conference/Submission1/Area_Chair_abcd'],
      noteReaderValues: [
        'NeurIPS.cc/2025/Conference/Program_Chairs',
        'NeurIPS.cc/2025/Conference/Submission1/Senior_Area_Chairs',
      ],
    }

    api.get = jest.fn(() =>
      Promise.resolve({
        groups: [
          {
            id: 'NeurIPS.cc/2025/Conference/Submission1/Area_Chairs',
            members: [
              'NeurIPS.cc/2025/Conference/Submission1/Area_Chair_abcd',
              'NeurIPS.cc/2025/Conference/Submission1/Area_Chair_efgh',
              'NeurIPS.cc/2025/Conference/Submission1/Area_Chair_ijkl',
              'NeurIPS.cc/2025/Conference/Submission1/Area_Chair_mnop',
            ],
          },
        ],
      })
    )

    const readerValue = await getNoteReaderValues(
      roleNames,
      invitation,
      noteEditorData,
      'token'
    )

    expect(api.get).toHaveBeenCalledWith(
      '/groups',
      {
        id: 'NeurIPS.cc/2025/Conference/Submission1/Area_Chairs',
      },
      expect.anything()
    )
    // signature should be added and reviewers group should not be added
    const expectedReaderValue = [
      'NeurIPS.cc/2025/Conference/Program_Chairs',
      'NeurIPS.cc/2025/Conference/Submission1/Senior_Area_Chairs',
      'NeurIPS.cc/2025/Conference/Submission1/Area_Chair_abcd',
    ]
    expect(readerValue).toEqual(expectedReaderValue)
  })

  test('return correct reader value in getNoteReaderValues (AC only)', async () => {
    // invitation has only all ACs group, add all ACs group
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
                  value: 'NeurIPS.cc/2025/Conference/Submission1/Area_Chairs', // all ACs group
                  optional: true,
                },
                { value: 'NeurIPS.cc/2025/Conference/Submission1/Reviewers', optional: true },
              ],
            },
          },
        },
      },
    }

    // user selection
    const noteEditorData = {
      editSignatureInputValues: ['NeurIPS.cc/2025/Conference/Submission1/Area_Chair_abcd'],
      noteReaderValues: [
        'NeurIPS.cc/2025/Conference/Program_Chairs',
        'NeurIPS.cc/2025/Conference/Submission1/Senior_Area_Chairs',
      ],
    }

    const readerValue = await getNoteReaderValues(
      roleNames,
      invitation,
      noteEditorData,
      'token'
    )

    expect(api.get).not.toHaveBeenCalled()

    // signature should be added and reviewers group should not be added
    const expectedReaderValue = [
      'NeurIPS.cc/2025/Conference/Program_Chairs',
      'NeurIPS.cc/2025/Conference/Submission1/Senior_Area_Chairs',
      'NeurIPS.cc/2025/Conference/Submission1/Area_Chairs',
    ]
    expect(readerValue).toEqual(expectedReaderValue)
  })

  test('return correct reader value in getNoteReaderValues (Secondary AC only)', async () => {
    // invitation has both all ACs group and all Secondary ACs group
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
                  value: 'NeurIPS.cc/2025/Conference/Submission1/Area_Chairs', // all ACs group
                  optional: true,
                },
                {
                  value: 'NeurIPS.cc/2025/Conference/Submission1/Secondary_Area_Chairs', // all secondary ACs group
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
      editSignatureInputValues: [
        'NeurIPS.cc/2025/Conference/Submission1/Secondary_Area_Chair_abcd',
      ],
      noteReaderValues: [
        'NeurIPS.cc/2025/Conference/Program_Chairs',
        'NeurIPS.cc/2025/Conference/Submission1/Senior_Area_Chairs',
      ],
    }

    const readerValue = await getNoteReaderValues(
      roleNames,
      invitation,
      noteEditorData,
      'token'
    )

    expect(api.get).not.toHaveBeenCalled()

    // signature should be added and reviewers group should not be added
    const expectedReaderValue = [
      'NeurIPS.cc/2025/Conference/Program_Chairs',
      'NeurIPS.cc/2025/Conference/Submission1/Senior_Area_Chairs',
      'NeurIPS.cc/2025/Conference/Submission1/Secondary_Area_Chairs',
    ]
    expect(readerValue).toEqual(expectedReaderValue)
  })

  test('handle get inGroup member failure', async () => {
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

    api.get = jest.fn(() =>
      Promise.reject(new Error('API call failed probably because user cannot read this group'))
    )

    const readerValue = await getNoteReaderValues(
      roleNames,
      invitation,
      noteEditorData,
      'token'
    )

    expect(api.get).toHaveBeenCalledWith(
      '/groups',
      {
        id: 'NeurIPS.cc/2025/Conference/Submission1/Reviewers',
      },
      expect.anything()
    )
    // no match for anonymous reviewer group (signature) so all reviewers group is added
    const expectedReaderValue = [
      'NeurIPS.cc/2025/Conference/Program_Chairs',
      'NeurIPS.cc/2025/Conference/Submission1/Senior_Area_Chairs',
      'NeurIPS.cc/2025/Conference/Submission1/Area_Chairs',
      'NeurIPS.cc/2025/Conference/Submission1/Reviewers',
    ]
    expect(readerValue).toEqual(expectedReaderValue)
  })
})
