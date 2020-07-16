const createTestCafe = require('testcafe')

const singleTestFileName = process.argv[2]
const skipSetup = process.argv[3]

const runTests = async () => {
  const testcafe = await createTestCafe()
  let testFileSrc = './tests/*Page*.ts'
  if (singleTestFileName) testFileSrc = `./tests/${singleTestFileName}`
  let runnerSrc = ['./tests/setup.ts', testFileSrc]
  if (skipSetup) runnerSrc = [testFileSrc]

  try {
    const runner = testcafe.createRunner()
    const failedCount = await runner
      .src(runnerSrc)
      .browsers(['chrome'])
      .run({
        // stopOnFirstFail: true,
      })
  } finally {
    await testcafe.close()
  }
}

runTests()
