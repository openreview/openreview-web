/* eslint-disable import/no-extraneous-dependencies */

import { useEffect, useRef } from 'react'
import { select } from 'd3-selection'
import { scaleLinear } from 'd3-scale'
import { bin } from 'd3-array'
import { axisBottom, axisLeft } from 'd3-axis'
import { format } from 'd3-format'
import floor from 'lodash/floor'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '../LoadingSpinner'

const HistogramStat = ({ id, stats, edgeBrowserUrlParams }) => {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const router = useRouter()

  const goToEdgeBrowser = (e, d) => {
    let dataList = []
    if (stats.tag === 'discrete') {
      const num = Math.floor(d[0])
      dataList = stats.interactiveData
        .filter((p) => p.num === num)
        .map((q) => q.data)
        .sort()
    } else {
      dataList = [
        ...new Set(
          stats.interactiveData.filter((p) => p.num >= d.x0 && p.num < d.x1).map((q) => q.data)
        ),
      ]
    }

    const localStorageKey =
      stats.tag === 'discrete' ? `${id}-x-${d[0]}` : `${id}-x-${d.x0}-to-${d.x1}`
    try {
      window.localStorage.setItem(
        localStorageKey,
        JSON.stringify({
          type: stats.type,
          data: dataList,
        })
      )
    } catch (error) {
      return
    }

    const {
      browseInvitations,
      editInvitation,
      conflictsInvitation,
      customMaxPapersInvitation,
      customLoadInvitation,
      aggregateScoreInvitation,
      assignmentLabel,
      referrerText,
      configNoteId,
      apiVersion,
    } = edgeBrowserUrlParams
    const type = stats.type === 'reviewer' ? 'type:tail' : 'type:head'
    const edgeBrowserUrl = `/edges/browse?\
start=staticList,${type},storageKey:${localStorageKey}\
&traverse=${editInvitation}\
&edit=${editInvitation}\
&browse=${aggregateScoreInvitation},label:${assignmentLabel};\
${browseInvitations.join(';')};\
${conflictsInvitation}\
${customMaxPapersInvitation ? `;${customMaxPapersInvitation},head:ignore` : ''}\
${customLoadInvitation ? `;${customLoadInvitation},head:ignore` : ''}\
&maxColumns=3\
&version=${apiVersion}
&referrer=${encodeURIComponent(`[${referrerText}](/assignments/stats?id=${configNoteId})`)}`

    router.push(edgeBrowserUrl)
  }

  const draw = () => {
    if (!stats) return

    const margin = {
      top: 45,
      right: 10,
      bottom: 40,
      left: 50,
    }
    const containerWidth = containerRef.current?.offsetWidth
    let svg = select(svgRef.current).attr('viewBox', `0 0 ${containerWidth} 500`)
    const width = containerWidth - margin.left - margin.right
    const height = 500 - margin.top - margin.bottom
    svg
      .append('text')
      .attr('class', 'stat-name')
      .attr('x', '55%')
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .text(stats.name)
    svg = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
    const binCount = stats.binCount ?? 20
    const xAxisBarLabelFontStyle =
      stats.tag === 'continuous' ? '.50rem sans-serif' : '.75rem sans-serif'
    const min =
      stats.tag === 'continuous' && Math.min(stats.data) < stats.min
        ? 2 * floor(Math.min(stats.data), 1)
        : stats.min
    const xmax = stats.tag === 'discrete' ? Math.max(stats.max, 10) + 0.5 : stats.max
    const xmin = stats.tag === 'discrete' ? min - 0.5 : min
    const x = scaleLinear()
      .domain([xmin, xmax])
      .rangeRound([0, width - 10])
    const y = scaleLinear().range([height, 0])

    let thresholds = []
    if (stats.tag === 'continuous') {
      thresholds = x.ticks(binCount).slice(1)
    } else if (stats.tag === 'discrete') {
      thresholds = [...Array(Math.round(xmax - xmin)).keys()].map((p) => p + xmin)
    }
    const barspace = stats.tag === 'discrete' ? 80 / thresholds.length : 1

    const histogram = bin().domain(x.domain()).thresholds(thresholds)
    const bins = histogram(stats.data)
    y.domain([0, bins.map((p) => p.length).reduce((a, b) => Math.max(a, b), 0)])

    const groups = svg
      .selectAll('rect')
      .data(bins)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${x(d.x0)},${y(d.length)})`)

    groups
      .append('text')
      .attr('dy', '-1em')
      .attr('y', 6)
      .attr('x', (d) => 10 + (x(d.x1) - x(d.x0)) / 2)
      .attr('text-anchor', 'middle')
      .style('font', xAxisBarLabelFontStyle)
      .style('fill', '#777')
      .text((d) => (d.length > 0 ? format(',.0f')(d.length) : null))

    const rect = groups
      .append('rect')
      .attr('x', 10 + (barspace < 2 ? 1 : barspace / 2))
      .attr('width', (d) =>
        x(d.x1) - x(d.x0) - barspace < 0 ? 0 : x(d.x1) - x(d.x0) - barspace
      )
      .attr('height', (d) => height - y(d.length))
      .attr('class', `bar ${stats.type || ''}`)

    if (stats.interactiveData) {
      rect.classed('clickable', true)
      const hoverRect = groups
        .append('rect')
        .attr('x', 10 + (barspace < 2 ? 1 : barspace / 2))
        .attr('y', (d) => -1 * y(d.length))
        .attr('width', (d) =>
          x(d.x1) - x(d.x0) - barspace < 0 ? 0 : x(d.x1) - x(d.x0) - barspace
        )
        .attr('height', (d) => (d.length === 0 ? 0 : height))
        .attr('class', 'hover-bar clickable')

      hoverRect.on('click', goToEdgeBrowser)
    }

    // #region X Axis
    const xAxisTickCount = stats.tag === 'discrete' ? Math.round(xmax - xmin) : binCount
    const xAxisTickFontSize = stats.tag === 'continuous' ? '0.5rem' : ''

    svg
      .append('g')
      .attr('class', 'axis axis--x')
      .style('font-size', xAxisTickFontSize)
      .attr('transform', `translate(10,${height})`)
      .call(axisBottom(x).ticks(xAxisTickCount))
      .append('text')
      .style('font', '.75rem sans-serif')
      .style('fill', '#777')
      .attr('text-anchor', 'middle')
      .attr('transform', `translate(${width / 2},${36})`)
      .text(stats.xLabel)
    // #endregion

    // #region Y Axis
    svg
      .append('g')
      .attr('class', 'axis axis--y')
      .attr('transform', 'translate(10,0)')
      .call(axisLeft(y).ticks(10))
      .append('text')
      .style('font', '.75rem sans-serif')
      .style('fill', '#777')
      .attr('text-anchor', 'middle')
      .attr('transform', `translate(${-40},${height / 2})rotate(-90)`)
      .text(stats.yLabel)
    // #endregion
  }

  useEffect(() => {
    draw()
  })

  if (!stats) return <LoadingSpinner inline text={null} />

  return (
    <div className={`bin-container${stats.fullWidth ? ' full-width' : ''}`} ref={containerRef}>
      <svg ref={svgRef} className="stat-bin" />
    </div>
  )
}

export default HistogramStat
