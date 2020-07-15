const createTestCafe = require('testcafe')

const runTests = async () => {
  const testcafe = await createTestCafe()

  try {
    const runner = testcafe.createRunner()

    const failedCount = await runner
      // .src(['./tests/index.ts', './tests/tasks.ts'])
      .src(['./tests/setup.ts', './tests/register.ts'])
      .browsers(['chrome'])
      .run({
        // stopOnFirstFail: true,
      })
  } finally {
    await testcafe.close()
  }
}

runTests()
