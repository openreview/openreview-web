'use client'

import { Button, Flex, Typography } from 'antd'

const { Text } = Typography

export default function DocsSearch({ onNeedSupport }) {
  return (
    <Flex vertical gap={12}>
      <Text type="secondary">If you need more help, please </Text>
      <Button
        type="link"
        size="small"
        style={{ padding: 0, alignSelf: 'flex-start' }}
        onClick={() => onNeedSupport()}
      >
        contact us
      </Button>
      <Text type="secondary">.</Text>
    </Flex>
  )
}
