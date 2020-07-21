const createTestCafe = require('testcafe')

require('dotenv').config()

const singleTestFileName = process.argv[2]

const runTests = async () => {
  const testcafe = await createTestCafe()
  const testFiles = `./tests/${singleTestFileName || '*.ts'}`

  try {
    const runner = testcafe.createRunner()
    const failedCount = await runner
      .src(testFiles)
      .browsers(['chrome'])
      .run({
        stopOnFirstFail: true,
      })
  } finally {
    await testcafe.close()
  }
}

runTests()
