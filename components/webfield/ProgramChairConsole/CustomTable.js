import { HolderOutlined } from '@ant-design/icons'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { Button, Flex, Input, Select, Table, theme, Typography } from 'antd'
import copy from 'copy-to-clipboard'
import { createContext, useContext, useMemo, useState } from 'react'
import { parseNumberField, pluralizeString, prettyField, prettyId } from '../../../lib/utils'
import { evaluateOperator } from '../../../lib/webfield-utils'
import ExportFile from '../../ExportFile'
import LoadingSpinner from '../../LoadingSpinner'
import WebFieldContext from '../../WebFieldContext'

const toNumber = (value) => {
  const number = parseNumberField(value)
  return Number.isNaN(number) ? null : number
}

const parseColumnKey = (key) => {
  const [path, computed] = key.split(':')
  const [source, field] = path.split('.')
  return { key, source, field, computed }
}

const summaryNames = ['avg', 'min', 'max', 'spread']
const comparisonOperators = ['>', '<', '>=', '<=']

const ColumnDragContext = createContext({})

const DraggableHeaderCell = ({ columnKey, style, ...props }) => {
  const {
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    isDragging,
    isOver,
    index,
    activeIndex,
  } = useSortable({ id: columnKey })
  const { token } = theme.useToken()
  const dropLineSide = activeIndex > index ? 'borderInlineStart' : 'borderInlineEnd'
  return (
    <ColumnDragContext.Provider value={{ listeners, setActivatorNodeRef }}>
      <th
        {...props}
        ref={setNodeRef}
        style={{
          ...style,
          ...(isDragging && { opacity: 0.4 }),
          ...(isOver && !isDragging && { [dropLineSide]: `2px solid ${token.colorLink}` }),
        }}
      />
    </ColumnDragContext.Provider>
  )
}

export default function CustomTable({ table, pcConsoleData }) {
  const {
    venueId,
    submissionId,
    submissionName,
    officialReviewName,
    officialMetaReviewName = 'Meta_Review',
    decisionName = 'Decision',
    customStageInvitations,
    metaReviewAgreementConfig,
    reviewerName = 'Reviewers',
    areaChairName = 'Area_Chairs',
    secondaryAreaChairName,
    seniorAreaChairName = 'Senior_Area_Chairs',
    areaChairsId,
    seniorAreaChairsId,
  } = useContext(WebFieldContext)
  const [title, setTitle] = useState(table?.title ?? '')
  const [rowSource, setRowSource] = useState(table?.rows ?? 'submission')
  const [columnKeys, setColumnKeys] = useState(
    table?.columns?.map((p) => p?.key ?? p) ?? ['submission:number', 'submission.title']
  )
  const [filters, setFilters] = useState(table?.filters ?? {})
  const [sort, setSort] = useState(table?.sort ?? null)
  const sensors = useSensors(useSensor(PointerSensor))
  const [draggedColumnKey, setDraggedColumnKey] = useState(null)
  const configuredLabels = Object.fromEntries(
    (table?.columns ?? []).flatMap((p) => (p?.label ? [[p.key, p.label]] : []))
  )
  const peopleNames = {
    reviewers: reviewerName,
    area_chairs: areaChairName,
    secondary_area_chairs: secondaryAreaChairName ?? 'Secondary_Area_Chairs',
    senior_area_chairs: seniorAreaChairName,
  }

  const data = useMemo(() => {
    if (!pcConsoleData.notes) return null
    const { notes, invitations = [], paperGroups = {}, allProfilesMap } = pcConsoleData

    const getName = (id) =>
      allProfilesMap?.get(id)?.preferredName ?? (id.startsWith('~') ? prettyId(id) : id)
    const getMemberIdsByNumber = (groups, getMemberIds) =>
      new Map(groups?.map((group) => [group.noteNumber, getMemberIds(group)]))
    const memberIdsByNumber = {
      reviewers: getMemberIdsByNumber(paperGroups.reviewerGroups, (group) =>
        group.members.map((p) => p.reviewerProfileId)
      ),
      ...(areaChairsId && {
        area_chairs: getMemberIdsByNumber(paperGroups.areaChairGroups, (group) =>
          group.members.map((p) => p.areaChairProfileId)
        ),
      }),
      ...(secondaryAreaChairName && {
        secondary_area_chairs: getMemberIdsByNumber(paperGroups.areaChairGroups, (group) =>
          (group.secondaries ?? []).map((p) => p.areaChairProfileId)
        ),
      }),
      ...(seniorAreaChairsId && {
        senior_area_chairs: getMemberIdsByNumber(
          paperGroups.seniorAreaChairGroups,
          (group) => group.members
        ),
      }),
    }

    const workflowStages = [
      [
        officialReviewName,
        (number) => pcConsoleData.officialReviewsByPaperNumberMap?.get(number) ?? [],
      ],
      [
        officialMetaReviewName,
        (number) => pcConsoleData.metaReviewsByPaperNumberMap?.get(number) ?? [],
      ],
      [
        decisionName,
        (number) => {
          const decision = pcConsoleData.decisionByPaperNumberMap?.get(number)
          return decision ? [decision] : []
        },
      ],
      ...(customStageInvitations ?? []).map(({ name }) => [
        name,
        (number) =>
          (pcConsoleData.customStageReviewsByPaperNumberMap?.get(number) ?? []).filter((p) =>
            p.invitations?.some((q) => q.endsWith(`/-/${name}`))
          ),
      ]),
      ...(metaReviewAgreementConfig
        ? [
            [
              metaReviewAgreementConfig.name,
              (number) =>
                pcConsoleData.metaReviewAgreementsByPaperNumberMap?.get(number) ?? [],
            ],
          ]
        : []),
    ].flatMap(([name, getReplies]) => (name ? { name, getReplies } : []))

    const invitationsById = new Map(invitations.map((p) => [p.id, p]))
    const getFields = (invitationId, stageNotes) => {
      const fields = new Map()
      const addedInvitationIds = new Set()
      const addForm = (id) => {
        const invitation =
          invitationsById.get(id) ??
          invitationsById.get(`${venueId}/-/${id.split('/-/').pop()}`)
        if (!invitation || addedInvitationIds.has(invitation.id)) return
        addedInvitationIds.add(invitation.id)
        const form =
          invitation.edit?.invitation?.edit?.note?.content ?? invitation.edit?.note?.content
        Object.entries(form ?? {}).forEach(([field, description]) => {
          const param = description?.value?.param
          if (!param || fields.has(field)) return
          const isNumber =
            ['integer', 'float'].includes(param.type) ||
            (param.enum?.length > 0 &&
              param.enum.every((p) => toNumber(p?.value ?? p) !== null))
          fields.set(field, { field, isNumber })
        })
      }
      addForm(invitationId)
      stageNotes.forEach((note) => note.invitations?.forEach(addForm))
      stageNotes.forEach((note) => {
        Object.keys(note.content ?? {}).forEach((field) => {
          if (!fields.has(field)) fields.set(field, { field, isNumber: false })
        })
      })
      return [...fields.values()]
    }

    return {
      notes,
      getName,
      memberIdsByNumber,
      submissionFields: getFields(submissionId, notes),
      workflowStages: workflowStages.map((stage) => ({
        ...stage,
        fields: getFields(
          `${venueId}/-/${stage.name}`,
          notes.flatMap((note) => stage.getReplies(note.number))
        ),
      })),
      getSignedBy: (number, reply) => {
        const signature = reply.signatures?.[0]
        if (!signature) return null
        const signedById =
          paperGroups.anonReviewerGroups?.[number]?.[signature] ??
          paperGroups.anonAreaChairGroups?.[number]?.[signature] ??
          signature
        return signedById.startsWith('~') || signedById.includes('@')
          ? getName(signedById)
          : prettyId(signedById, true)
      },
    }
  }, [
    pcConsoleData,
    venueId,
    submissionId,
    officialReviewName,
    officialMetaReviewName,
    decisionName,
    customStageInvitations,
    metaReviewAgreementConfig,
    areaChairsId,
    secondaryAreaChairName,
    seniorAreaChairsId,
  ])

  const describeColumn = (key) => {
    const { source, field, computed } = parseColumnKey(key)
    let label
    let optionLabel
    if (source === 'submission') {
      if (computed === 'number') label = 'Number'
      else if (computed) label = prettyField(peopleNames[computed] ?? computed)
      else label = prettyField(field)
      optionLabel = label
    } else if (!field) {
      label = computed === 'count' ? `${prettyField(source)} Count` : 'Signed By'
      optionLabel = computed === 'count' ? label : `${prettyField(source)} Signed By`
    } else {
      label = computed ? `${prettyField(field)} ${prettyField(computed)}` : prettyField(field)
      optionLabel = `${prettyField(source)} ${label}`
    }
    return { key, source, field, computed, label: configuredLabels[key] ?? label, optionLabel }
  }

  const columns = columnKeys.map(describeColumn)

  const rows = useMemo(() => {
    if (!data) return []
    const workflowStagesByName = new Map(data.workflowStages.map((p) => [p.name, p]))
    const getValue = ({ source, field, computed }, { note, reply }) => {
      if (source === 'submission' && computed === 'number') return note.number
      let values
      if (source === 'submission') {
        values = computed
          ? (data.memberIdsByNumber[computed]?.get(note.number) ?? []).map(data.getName)
          : [note.content?.[field]?.value].flat()
      } else {
        const replies =
          reply && source === rowSource
            ? [reply]
            : (workflowStagesByName.get(source)?.getReplies(note.number) ?? [])
        if (computed === 'count') return replies.length
        values =
          computed === 'signed_by'
            ? replies.map((p) => data.getSignedBy(note.number, p))
            : replies.flatMap((p) => p.content?.[field]?.value)
      }
      values = values.flatMap((p) => {
        if (p === undefined || p === null || p === '') return []
        if (typeof p === 'object') return p.fullname ?? JSON.stringify(p)
        return p
      })

      if (summaryNames.includes(computed)) {
        const numbers = values.map(toNumber).filter((p) => p !== null)
        if (!numbers.length) return null
        const min = Math.min(...numbers)
        const max = Math.max(...numbers)
        return {
          avg: numbers.reduce((sum, p) => sum + p, 0) / numbers.length,
          min,
          max,
          spread: max - min,
        }[computed]
      }
      if (!values.length) return null
      return values.length > 1 ? values : values[0]
    }

    const records =
      rowSource === 'submission'
        ? data.notes.map((note) => ({ key: note.id, note }))
        : data.notes.flatMap((note) =>
            (workflowStagesByName.get(rowSource)?.getReplies(note.number) ?? []).map(
              (reply) => ({
                key: reply.id,
                note,
                reply,
              })
            )
          )
    const columnsToGet = columnKeys.map(parseColumnKey)
    return records.map((record) => ({
      ...record,
      values: columnsToGet.map((column) => getValue(column, record)),
    }))
  }, [data, rowSource, columnKeys])

  const isNumberColumn = columns.map(({ source, field, computed }) => {
    if (['number', 'count', ...summaryNames].includes(computed)) return true
    if (computed || !field) return false
    const fields =
      source === 'submission'
        ? data?.submissionFields
        : data?.workflowStages.find((p) => p.name === source)?.fields
    return fields?.find((p) => p.field === field)?.isNumber ?? false
  })

  const columnFilters = columns.map((column, index) => {
    const [, operator = '=', target] =
      (filters[column.key] ?? '').trim().match(/^(==|!=|>=|<=|>|<|=)?\s*(.*)$/s) ?? []
    if (!target) return null
    const targetNumber = isNumberColumn[index] ? toNumber(target) : null
    if (comparisonOperators.includes(operator) && targetNumber === null) {
      return { index, isInvalid: true }
    }
    return { index, operator, target: targetNumber ?? target }
  })

  const visibleRows = rows.filter((row) =>
    columnFilters.every((columnFilter) => {
      if (!columnFilter || columnFilter.isInvalid) return true
      const { index, operator, target } = columnFilter
      const value = row.values[index]
      if (value === null) return operator === '!='
      const items = (Array.isArray(value) ? value : [value]).map((p) => {
        if (typeof target === 'number') return toNumber(p)
        return typeof p === 'number' ? String(p) : p
      })
      try {
        if (comparisonOperators.includes(operator)) {
          return items.some((p) => evaluateOperator(operator, p, target))
        }
        return evaluateOperator(operator, items.length > 1 ? items : items[0], target)
      } catch {
        return true
      }
    })
  )
  const sortIndex = columns.findIndex((p) => p.key === sort?.key)
  if (sortIndex >= 0) {
    visibleRows.sort((rowA, rowB) => {
      const a = rowA.values[sortIndex]
      const b = rowB.values[sortIndex]
      if (a === null || b === null) return Number(a === null) - Number(b === null)
      const result =
        isNumberColumn[sortIndex] && toNumber(a) !== null && toNumber(b) !== null
          ? toNumber(a) - toNumber(b)
          : String(a).localeCompare(String(b), undefined, { numeric: true })
      return sort.order === 'descend' ? -result : result
    })
  }

  // a table without a title still gets a file name and a tab label
  const tableTitle = title.trim() || 'Custom Table'

  const formatValue = (value, column) => {
    if (Array.isArray(value)) return value.join(', ')
    if (column.computed === 'avg') return value.toFixed(2)
    return String(value)
  }

  const copyConfig = () => {
    const usedFilters = Object.fromEntries(
      columnKeys.flatMap((key) => (filters[key]?.trim() ? [[key, filters[key].trim()]] : []))
    )
    copy(
      JSON.stringify(
        {
          title: tableTitle,
          rows: rowSource,
          columns: columnKeys.map((key) =>
            configuredLabels[key] ? { key, label: configuredLabels[key] } : key
          ),
          ...(Object.keys(usedFilters).length > 0 && { filters: usedFilters }),
          ...(sortIndex >= 0 && { sort }),
        },
        null,
        2
      )
    )
    promptMessage(
      'Table config copied. Add it to customTables in the web config of the console to show it as a tab.'
    )
  }

  const renderValue = (value, column, row) => {
    if (value === null) return <Typography.Text type="secondary">—</Typography.Text>
    if (column.key === 'submission.title') {
      const forumUrl = `/forum?id=${row.note.forum}`
      return (
        <a
          href={row.reply ? `${forumUrl}&noteId=${row.reply.id}` : forumUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {value}
        </a>
      )
    }
    const text = formatValue(value, column)
    if (text.length > 140) {
      return (
        <Typography.Paragraph
          ellipsis={{ rows: 2, expandable: 'collapsible' }}
          style={{ marginBottom: 0, minWidth: 280, whiteSpace: 'pre-line' }}
        >
          {text}
        </Typography.Paragraph>
      )
    }
    return text
  }

  if (!data) return <LoadingSpinner />

  const optionGroups = [
    {
      source: 'submission',
      label: prettyField(submissionName),
      keys: [
        'submission:number',
        ...data.submissionFields.map(({ field }) => `submission.${field}`),
        ...Object.keys(data.memberIdsByNumber).map((p) => `submission:${p}`),
      ],
    },
    ...data.workflowStages.map((stage) => ({
      source: stage.name,
      label: prettyField(stage.name),
      keys: [
        `${stage.name}:count`,
        `${stage.name}:signed_by`,
        ...stage.fields.flatMap(({ field, isNumber }) => [
          `${stage.name}.${field}`,
          ...(isNumber ? summaryNames.map((p) => `${stage.name}.${field}:${p}`) : []),
        ]),
      ],
    })),
  ]
  columnKeys.forEach((key) => {
    if (optionGroups.some((group) => group.keys.includes(key))) return
    const { source } = parseColumnKey(key)
    let group = optionGroups.find((p) => p.source === source)
    if (!group) {
      group = { source, label: prettyField(source), keys: [] }
      optionGroups.push(group)
    }
    group.keys.push(key)
  })

  return (
    <Flex vertical gap="small">
      <Flex gap="small" align="center" wrap>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title of the table"
          style={{ width: 240 }}
        />
        <Select
          value={rowSource}
          onChange={setRowSource}
          options={[
            { value: 'submission', label: `One row per ${submissionName.toLowerCase()}` },
            ...data.workflowStages.map((p) => ({
              value: p.name,
              label: `One row per ${prettyField(p.name).toLowerCase()}`,
            })),
          ]}
          style={{ width: 240 }}
        />
        <ExportFile
          records={visibleRows}
          fileName={`${tableTitle}.csv`}
          exportColumns={columns.map((column, index) => ({
            header: column.label,
            getValue: (row) =>
              row.values[index] === null ? '' : formatValue(row.values[index], column),
          }))}
        />
        <Button onClick={copyConfig} type="primary">
          Copy Config
        </Button>
      </Flex>
      <Select
        mode="multiple"
        menuItemSelectedIcon={null}
        placeholder="Select columns to display"
        value={columnKeys}
        onChange={setColumnKeys}
        options={optionGroups.map(({ label, keys }) => ({
          label,
          title: label,
          options: keys.map((key) => ({ value: key, label: describeColumn(key).optionLabel })),
        }))}
        showSearch={{ optionFilterProp: 'label' }}
        style={{ width: '100%' }}
      />
      <Typography.Text type="secondary">
        A filter matches text anywhere in a cell, or compares when it starts with an operator:
        ==, !=, &gt;, &lt;, &gt;=, &lt;=
      </Typography.Text>
      {columnKeys.length === 0 ? (
        <Typography.Text type="secondary" italic>
          No column is selected.
        </Typography.Text>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => setDraggedColumnKey(active.id)}
          onDragCancel={() => setDraggedColumnKey(null)}
          onDragEnd={({ active, over }) => {
            setDraggedColumnKey(null)
            if (!over || active.id === over.id) return
            setColumnKeys((keys) =>
              arrayMove(keys, keys.indexOf(active.id), keys.indexOf(over.id))
            )
          }}
        >
          <SortableContext items={columnKeys} strategy={horizontalListSortingStrategy}>
            <Table
              size="small"
              rowKey="key"
              dataSource={visibleRows}
              components={{ header: { cell: DraggableHeaderCell } }}
              locale={{
                emptyText: (
                  <Typography.Text type="secondary" italic>
                    No{' '}
                    {pluralizeString(
                      prettyField(rowSource === 'submission' ? submissionName : rowSource)
                    ).toLowerCase()}{' '}
                    {rows.length ? 'matching the filters' : 'to display'}.
                  </Typography.Text>
                ),
              }}
              scroll={{ x: true }}
              pagination={{
                defaultPageSize: 25,
                showSizeChanger: true,
                placement: ['bottomCenter'],
                size: 'medium',
              }}
              columns={columns.map((column, index) => ({
                key: column.key,
                onHeaderCell: () => ({ columnKey: column.key }),
                title: (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ColumnDragContext.Consumer>
                        {({ listeners, setActivatorNodeRef }) => (
                          <HolderOutlined
                            ref={setActivatorNodeRef}
                            {...listeners}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'grab' }}
                          />
                        )}
                      </ColumnDragContext.Consumer>
                      {column.label}
                    </div>
                    <Input
                      size="small"
                      placeholder="filter"
                      value={filters[column.key] ?? ''}
                      status={columnFilters[index]?.isInvalid ? 'error' : undefined}
                      onChange={(e) =>
                        setFilters({ ...filters, [column.key]: e.target.value })
                      }
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      style={{ marginTop: 4, minWidth: 80 }}
                    />
                  </div>
                ),
                render: (_, row) => renderValue(row.values[index], column, row),
                sorter: true,
                sortOrder: sortIndex === index ? sort.order : null,
              }))}
              onChange={(_pagination, _filters, sorter, { action }) => {
                if (action !== 'sort') return
                setSort(sorter.order ? { key: sorter.columnKey, order: sorter.order } : null)
              }}
            />
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {draggedColumnKey && (
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  background: 'white',
                }}
              >
                {columns.find((p) => p.key === draggedColumnKey)?.label}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </Flex>
  )
}
