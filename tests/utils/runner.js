const createTestCafe = require('testcafe')

const singleTestFileName = process.argv[2]

const runTests = async () => {
  const testcafe = await createTestCafe()
  let testFileSrc = './tests/*.ts'
  if (singleTestFileName) testFileSrc = `./tests/${singleTestFileName}`

  try {
    const runner = testcafe.createRunner()
    const failedCount = await runner
      .src(testFileSrc)
      .browsers(['chrome'])
      .run({
        stopOnFirstFail: true,
      })
  } finally {
    await testcafe.close()
  }
}

runTests()
