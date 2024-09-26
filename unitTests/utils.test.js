import {
  getDefaultTimezone,
  getPath,
  getSubInvitationContentFieldDisplayValue,
  isInstitutionEmail,
  stringToObject,
} from '../lib/utils'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('utils', () => {
  test('convert string to object in stringToObject', () => {
    let prefilledValues = {}
    expect(stringToObject(prefilledValues)).toEqual(undefined)

    prefilledValues = { 'edit.note.content.title': 'some prefilled title' }
    expect(stringToObject(prefilledValues)).toEqual({
      content: { title: { value: 'some prefilled title' } },
    })

    // query has duplicated key to pass array type
    prefilledValues = {
      'edit.note.content.reject_reason': [
        'Other',
        'Other',
        'Reviewer never submitted their review',
      ],
    }
    expect(stringToObject(prefilledValues)).toEqual({
      content: {
        reject_reason: { value: ['Other', 'Reviewer never submitted their review'] },
      },
    })

    // fill multiple fields
    prefilledValues = {
      'edit.note.content.title': 'some prefilled title',
      'edit.note.content.reject_reason': [
        'Other',
        'Other',
        'Reviewer never submitted their review',
      ],
      'edit.note.content.comment': 'some prefilled comment',
    }
    expect(stringToObject(prefilledValues)).toEqual({
      content: {
        title: { value: 'some prefilled title' },
        reject_reason: { value: ['Other', 'Reviewer never submitted their review'] },
        comment: { value: 'some prefilled comment' },
      },
    })
  })

  test('validate institution email in isInstitutionEmail', () => {
    const institutionDomains = ['umass.edu', 'cs.umass.edu']

    let validEmail = 'test@umass.edu'
    expect(isInstitutionEmail(validEmail, institutionDomains)).toEqual(true)

    validEmail = 'test@cs.umass.edu'
    expect(isInstitutionEmail(validEmail, institutionDomains)).toEqual(true)

    let validSubdomainEmail = 'test@test.umass.edu'
    expect(isInstitutionEmail(validSubdomainEmail, institutionDomains)).toEqual(true)

    validSubdomainEmail = 'test@a.long.sub.domain.cs.umass.edu'
    expect(isInstitutionEmail(validSubdomainEmail, institutionDomains)).toEqual(true)

    let invalidEmail = 'test@umass.com'
    expect(isInstitutionEmail(invalidEmail, institutionDomains)).toEqual(false)

    invalidEmail = 'test@fakeumass.com'
    expect(isInstitutionEmail(invalidEmail, institutionDomains)).toEqual(false)

    invalidEmail = 'test@fakeumass.edu'
    expect(isInstitutionEmail(invalidEmail, institutionDomains)).toEqual(false)

    invalidEmail = 'test@cs.edu'
    expect(isInstitutionEmail(invalidEmail, institutionDomains)).toEqual(false)
  })

  test('return timezone label and value in getDefaultTimezone if there is a match', () => {
    const originalDate = global.Date
    // #region no offset
    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 0,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT)')).toEqual(true)
    // #endregion

    // #region positive offset
    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 60,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -1:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 120,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -2:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 180,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -3:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 210,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -3:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 240,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -4:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 270,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -4:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 300,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -5:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 360,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -6:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 420,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -7:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 480,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -8:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 540,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -9:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 600,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -10:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 660,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -11:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 720,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -12:00)')).toEqual(true)
    // #endregion

    // #region negative offset
    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -60,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +1:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -120,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +2:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -180,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +3:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -210,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +3:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -240,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +4:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -270,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +4:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -300,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +5:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -330,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +5:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -345,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +5:45)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -360,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +6:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -390,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +6:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -420,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +7:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -480,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +8:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -525,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +8:45)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -540,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +9:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -570,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +9:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -600,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +10:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -630,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +10:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -660,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +11:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -690,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +11:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -720,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +12:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -765,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +12:45)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -780,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +13:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -840,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +14:00)')).toEqual(true)
    // #endregion

    // #region non-matching offset
    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 123,
    }))
    expect(getDefaultTimezone()).toEqual(null)
    // #endregion
    global.Date = originalDate
  })

  test("return path from sub invitation's edit.invitation", () => {
    let contentKey
    let expectedPath
    let resultPath

    // #region no invitation
    contentKey = 'activation_date'
    let subInvitation = {
      edit: {
        content: {
          [contentKey]: {},
        },
        invitation: undefined,
      },
    }

    expectedPath = null
    resultPath = getPath(subInvitation.edit.invitation, contentKey)
    expect(expectedPath).toEqual(resultPath)
    // #endregion

    // #region no matching path
    contentKey = 'activation_date'
    subInvitation = {
      edit: {
        content: {
          [contentKey]: {},
        },
        invitation: {
          cdate: '${2/content/not_activation_date/value}',
        },
      },
    }

    expectedPath = null
    resultPath = getPath(subInvitation.edit.invitation, contentKey)
    expect(expectedPath).toEqual(resultPath)
    // #endregion

    // #region simple direct map
    contentKey = 'activation_date'
    subInvitation = {
      edit: {
        content: {
          [contentKey]: {},
        },
        invitation: {
          cdate: '${2/content/activation_date/value}',
        },
      },
    }

    expectedPath = 'cdate'
    resultPath = getPath(subInvitation.edit.invitation, contentKey)
    expect(expectedPath).toEqual(resultPath)
    // #endregion

    // #region multiple map take first hit
    contentKey = 'deadline'
    subInvitation = {
      edit: {
        content: {
          [contentKey]: {},
        },
        invitation: {
          duedate: '${2/content/deadline/value}',
          expdate: '${2/content/deadline/value}+1800000',
        },
      },
    }

    expectedPath = 'duedate' // will match duedate first
    resultPath = getPath(subInvitation.edit.invitation, contentKey)
    expect(expectedPath).toEqual(resultPath)
    // #endregion

    // #region ignore manipulation expression
    contentKey = 'deadline'
    subInvitation = {
      edit: {
        content: {
          [contentKey]: {},
        },
        invitation: {
          expdate: '${2/content/deadline/value}+1800000',
        },
      },
    }

    expectedPath = 'expdate'
    resultPath = getPath(subInvitation.edit.invitation, contentKey)
    expect(expectedPath).toEqual(resultPath)
    // #endregion

    // #region get nested path in invitation content
    contentKey = 'email_authors'
    subInvitation = {
      edit: {
        content: {
          [contentKey]: {},
        },
        invitation: {
          content: {
            email_authors: {
              value: '${4/content/email_authors/value}',
            },
          },
        },
      },
    }

    expectedPath = 'content.email_authors.value'
    resultPath = getPath(subInvitation.edit.invitation, contentKey)
    expect(expectedPath).toEqual(resultPath)
    // #endregion

    // #region get nested path in edit.note
    contentKey = 'note_license'
    subInvitation = {
      edit: {
        content: {
          [contentKey]: {},
        },
        invitation: {
          edit: {
            note: {
              license: {
                param: {
                  enum: ['${7/content/note_license/value}'],
                },
              },
            },
          },
        },
      },
    }

    expectedPath = 'edit.note.license.param.enum'
    resultPath = getPath(subInvitation.edit.invitation, contentKey)
    expect(expectedPath).toEqual(resultPath)
    // #endregion

    // #region get nested path in edit.note.content
    contentKey = 'pdf_readers'
    subInvitation = {
      edit: {
        content: {
          [contentKey]: {},
        },
        invitation: {
          edit: {
            note: {
              content: {
                pdf: {
                  readers: ['${7/content/pdf_readers/value}'],
                },
              },
            },
          },
        },
      },
    }

    expectedPath = 'edit.note.content.pdf.readers'
    resultPath = getPath(subInvitation.edit.invitation, contentKey)
    expect(expectedPath).toEqual(resultPath)
    // #endregion
  })

  test('return sub invitation value for display from workflow invitation', () => {
    let workflowInvitation
    let path
    let expectedValue
    let resultValue

    // #region path not found
    workflowInvitation = {}
    path = null
    expectedValue = null
    resultValue = getSubInvitationContentFieldDisplayValue(workflowInvitation, path)
    expect(expectedValue).toEqual(resultValue)
    // #endregion

    // #region boolean/string value
    workflowInvitation = {
      id: 'ICLR.cc/2025/Conference/-/Submission',
      content: { email_authors: { value: false } },
    }
    path = 'content.email_authors.value'
    expectedValue = 'false'
    resultValue = getSubInvitationContentFieldDisplayValue(workflowInvitation, path, 'boolean')
    expect(expectedValue).toEqual(resultValue)

    resultValue = getSubInvitationContentFieldDisplayValue(workflowInvitation, path)
    expect(expectedValue).toEqual(resultValue)
    // #endregion

    // #region date as formatted string
    workflowInvitation = {
      id: 'ICLR.cc/2025/Conference/-/Confidential_Comment',
      edit: {
        invitation: {
          expdate: 1726752060851,
        },
      },
    }
    path = 'edit.invitation.expdate'
    expectedValue = 'Sep 19, 2024, 1:21 PM'
    resultValue = getSubInvitationContentFieldDisplayValue(
      workflowInvitation,
      path,
      'date',
      'UTC' // github ci timezone
    )
    expect(expectedValue).toEqual(resultValue)
    // #endregion

    // #region content field show object keys
    workflowInvitation = {
      id: 'ICLR.cc/2025/Conference/-/Confidential_Comment',
      edit: {
        note: {
          content: {
            title: {
              order: 1,
              description:
                'Title of paper. Add TeX formulas using the following formats: $In-line Formula$ or $$Block Formula$$.',
              value: {
                param: {
                  type: 'string',
                  regex: '^.{1,250}$',
                },
              },
            },
            authors: {
              order: 2,
              value: {
                param: {
                  type: 'string[]',
                  regex: '[^;,\\n]+(,[^,\\n]+)*',
                  hidden: true,
                },
              },
            },
            authorids: {
              order: 3,
              description:
                'Search author profile by first, middle and last name or email address. If the profile is not found, you can add the author by completing first, middle, and last names as well as author email address.',
              value: {
                param: {
                  type: 'profile[]',
                  regex:
                    "^~\\S+$|^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$",
                  mismatchError: 'must be a valid email or profile ID',
                },
              },
            },
            TLDR: {
              order: 5,
              description: '"Too Long; Didn\'t Read": a short sentence describing your paper',
              value: {
                param: {
                  fieldName: 'TL;DR',
                  type: 'string',
                  maxLength: 250,
                  optional: true,
                  deletable: true,
                },
              },
            },
            abstract: {
              order: 6,
              description:
                'Abstract of paper. Add TeX formulas using the following formats: $In-line Formula$ or $$Block Formula$$.',
              value: {
                param: {
                  type: 'string',
                  maxLength: 5000,
                  markdown: true,
                  input: 'textarea',
                },
              },
            },
            pdf: {
              order: 7,
              description: 'Upload a PDF file that ends with .pdf.',
              value: {
                param: {
                  type: 'file',
                  maxSize: 50,
                  extensions: ['pdf'],
                },
              },
            },
            subject_area: {
              order: 10,
              description: 'Select one subject area.',
              value: {
                param: {
                  type: 'string',
                  enum: [
                    '3D from multi-view and sensors',
                    '3D from single images',
                    'Adversarial attack and defense',
                    'Autonomous driving',
                    'Biometrics',
                    'Computational imaging',
                    'Computer vision for social good',
                    'Computer vision theory',
                    'Datasets and evaluation',
                  ],
                  input: 'select',
                },
              },
            },
            venue: {
              value: {
                param: {
                  const: 'ICLR 2025 Conference Submission',
                  hidden: true,
                },
              },
            },
            venueid: {
              value: {
                param: {
                  const: 'ICLR.cc/2025/Conference/Submission',
                  hidden: true,
                },
              },
            },
          },
        },
      },
    }
    path = 'edit.note.content'

    resultValue = getSubInvitationContentFieldDisplayValue(workflowInvitation, path, 'content')

    expect(resultValue.props.children[0].length).toEqual(3) // 3 are displayed
    expect(resultValue.props.children[1].props.children.length).toEqual(6) // 6 are hidden in collapse
    // #endregion

    // #region enum field show descriptions
    workflowInvitation = {
      id: 'ICLR.cc/2025/Conference/-/Confidential_Comment',
      edit: {
        invitation: {
          edit: {
            note: {
              readers: {
                param: {
                  items: [
                    {
                      value: 'ICLR.cc/2025/Conference/Program_Chairs',
                      optional: false,
                      description: 'Program Chairs',
                    },
                    {
                      value:
                        'ICLR.cc/2025/Conference/Submission${8/content/noteNumber/value}/Senior_Area_Chairs',
                      optional: false,
                      description: 'Assigned Senior Area Chairs',
                    },
                    {
                      value:
                        'ICLR.cc/2025/Conference/Submission${8/content/noteNumber/value}/Area_Chairs',
                      optional: true,
                      description: 'Assigned Area Chairs',
                    },
                    {
                      value:
                        'ICLR.cc/2025/Conference/Submission${8/content/noteNumber/value}/Reviewers/Submitted',
                      optional: true,
                      description: 'Assigned Reviewers who already submitted their review',
                    },
                  ],
                },
              },
            },
          },
        },
      },
    }
    path = 'edit.invitation.edit.note.readers.param.items'

    resultValue = getSubInvitationContentFieldDisplayValue(
      workflowInvitation,
      path,
      'object[]'
    )
    expect(resultValue.props.children[0].length).toEqual(3) // 3 are displayed
    expect(resultValue.props.children[1].props.children.length).toEqual(1) // 1 in collapse
    // #endregion

    // #region reader field show value segments
    workflowInvitation = {
      id: 'ICLR.cc/2025/Conference/-/Official_Review',
      edit: {
        invitation: {
          edit: {
            note: {
              readers: [
                'ICLR.cc/2025/Conference/Program_Chairs',
                'ICLR.cc/2025/Conference/Submission${5/content/noteNumber/value}/Senior_Area_Chairs',
                'ICLR.cc/2025/Conference/Submission${5/content/noteNumber/value}/Area_Chairs',
                'ICLR.cc/2025/Conference/Submission${5/content/noteNumber/value}/Reviewers',
              ],
            },
          },
        },
      },
    }
    path = 'edit.invitation.edit.note.readers'
    resultValue = getSubInvitationContentFieldDisplayValue(
      workflowInvitation,
      path,
      'string[]'
    )

    expect(resultValue.props.children[0][0].props.children[0]).toEqual(
      'ICLR 2025 Conference Program Chairs'
    )
    expect(resultValue.props.children[0][1].props.children).toEqual([
      'ICLR 2025 Conference Submission ',
      expect.objectContaining({ type: 'em', props: { children: 'noteNumber' } }),
      ' Senior Area Chairs',
    ])
    expect(resultValue.props.children[0][2].props.children).toEqual([
      'ICLR 2025 Conference Submission ',
      expect.objectContaining({ type: 'em', props: { children: 'noteNumber' } }),
      ' Area Chairs',
    ])
    expect(resultValue.props.children[1].props.children[0].props.children).toEqual([
      'ICLR 2025 Conference Submission ',
      expect.objectContaining({ type: 'em', props: { children: 'noteNumber' } }),
      ' Reviewers',
    ])
    // #endregion
  })
})
