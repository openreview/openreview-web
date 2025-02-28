import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import dayjs from 'dayjs';

const Timeline = ({ replies, onRangeChange }) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const brushRef = useRef(null);
  const internalBrushUpdate = useRef(false);

  // Measure container width
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerWidth(rect.width);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Zoom scale state
  const [zoomScale, setZoomScale] = useState(1);
  const baseWidth = containerWidth > 0 ? containerWidth : 2000;
  const timelineWidth = baseWidth * zoomScale;

  const margin = { top: 10, right: 10, bottom: 30, left: 10 };
  const innerHeight = 50;
  const timelineHeight = innerHeight + margin.top + margin.bottom;

  // Compute time range from replies timestamps (UNIX ms)
  const times = (replies || []).map(note => note.cdate);
  let minTime, maxTime;
  if (times.length > 0) {
    minTime = Math.min(...times);
    maxTime = Math.max(...times);
  } else {
    const now = Date.now();
    minTime = now - 86400000;
    maxTime = now + 86400000;
  }
  if (minTime === maxTime) {
    minTime = minTime - 86400000;
    maxTime = maxTime + 86400000;
  }

  // Create an xScale with a fixed domain and a range that updates with timelineWidth
  const xScale = useMemo(() => {
    return d3.scaleTime()
      .domain([new Date(minTime), new Date(maxTime)])
      .range([margin.left, timelineWidth - margin.right])
      .clamp(true);
  }, [minTime, maxTime, timelineWidth, margin.left, margin.right]);

  // Store selected range (initially full range)
  const [selectedRange, setSelectedRange] = useState([minTime, maxTime]);

  // Draw or update the axis whenever xScale changes.
  useEffect(() => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.selectAll('.axis').remove();

      // Dynamically compute tick count based on zoomScale.
      const tickCount = Math.max(2, Math.floor(5 * zoomScale));
      const xAxis = d3.axisBottom(xScale)
        .ticks(tickCount)
        .tickFormat(d3.timeFormat('%b %d'));

      svg.append('g')
         .attr('class', 'axis')
         .attr('transform', `translate(0, ${margin.top + innerHeight})`)
         .call(xAxis);
    }
  }, [xScale, margin.top, innerHeight, zoomScale]);

  // Initialize brush for selecting a time range.
  useEffect(() => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.selectAll('.brush').remove();
      const brush = d3.brushX()
        .extent([[margin.left, margin.top], [timelineWidth - margin.right, margin.top + innerHeight]])
        .on('brush', (event) => {
          event.sourceEvent && event.sourceEvent.stopPropagation();
          if (!event.selection) return;
          internalBrushUpdate.current = true;
          let [x0, x1] = event.selection;
          x0 = Math.max(margin.left, Math.min(x0, timelineWidth - margin.right));
          x1 = Math.max(margin.left, Math.min(x1, timelineWidth - margin.right));
          const rawStart = xScale.invert(x0).getTime();
          const rawEnd = xScale.invert(x1).getTime();
          const newStart = Math.max(minTime, Math.min(rawStart, maxTime));
          const newEnd = Math.max(minTime, Math.min(rawEnd, maxTime));
          setSelectedRange([newStart, newEnd]);
          if (onRangeChange) onRangeChange([newStart, newEnd]);
        })
        .on('end', (event) => {
          event.sourceEvent && event.sourceEvent.stopPropagation();
          if (!event.selection) {
            setSelectedRange([minTime, maxTime]);
            if (onRangeChange) onRangeChange([minTime, maxTime]);
          }
        });
      brushRef.current = brush;
      svg.append('g')
         .attr('class', 'brush')
         .call(brush);
    }
  }, [xScale, timelineWidth, margin.left, margin.right, margin.top, innerHeight, minTime, maxTime, onRangeChange]);

  // Update brush position when selectedRange changes externally.
  useEffect(() => {
    if (internalBrushUpdate.current) {
      internalBrushUpdate.current = false;
      return;
    }
    if (svgRef.current && brushRef.current) {
      d3.select(svgRef.current)
        .select('.brush')
        .call(brushRef.current.move, [
          xScale(new Date(selectedRange[0])),
          xScale(new Date(selectedRange[1]))
        ]);
    }
  }, [selectedRange, xScale]);

  // Zoom button handlers update the zoomScale state.
  const handleZoomIn = () => {
    setZoomScale(prev => prev * 2);
  };
  const handleZoomOut = () => {
    setZoomScale(prev => prev * 0.5);
  };

  // Reset handler to set the time range back to full range.
  const handleReset = () => {
    setSelectedRange([minTime, maxTime]);
    if (onRangeChange) onRangeChange([minTime, maxTime]);
    if (svgRef.current && brushRef.current) {
      d3.select(svgRef.current)
        .select('.brush')
        .call(brushRef.current.move, [
          xScale(new Date(minTime)),
          xScale(new Date(maxTime))
        ]);
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      {/* Header: Dropdown and Reset button */}
      <div style={{ marginBottom: '5px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '5px' }}>
          <select className="form-control" style={{ fontSize: '14px', width: 'auto', display: 'inline-block' }}>
            <option>All Stages</option>
            <option>Action Items</option>
            <option>Custom View 1</option>
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button className="btn btn-primary btn-xs" onClick={handleReset}>
            Reset Time Range
          </button>
        </div>
      </div>

      {/* Timeline SVG */}
      <div
        style={{
          height: timelineHeight,
          width: '100%',
          overflowX: 'auto',
          border: '1px solid #ccc',
          position: 'relative',
        }}
      >
        <svg
          ref={svgRef}
          width={timelineWidth}
          height={timelineHeight}
          style={{ backgroundColor: '#f7f7f7' }}
        >
          {replies &&
            replies.map((note) => (
              <circle
                key={note.id}
                data-cdate={note.cdate}
                cx={xScale(new Date(note.cdate))}
                cy={margin.top + innerHeight / 2}
                r={3}
                fill="#007bff"
                aria-label={dayjs(note.cdate).format('MMM DD, YYYY HH:mm')}
              />
            ))}
        </svg>
      </div>

      {/* Clickable stage segments */}
      <div style={{ display: 'flex' }}>
        {[
          'Before Submission',
          'Matching and Assignments',
          'Reviewing Period',
          'Decision Release',
        ].map((label, index) => {
          const start = minTime + ((maxTime - minTime) / 4) * index;
          const end = minTime + ((maxTime - minTime) / 4) * (index + 1);
          return (
            <div
              key={index}
              onClick={() => setSelectedRange([start, end])}
              style={{
                flex: 1,
                height: '20px',
                backgroundColor: '#e0e0e0',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'background-color 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b0b0b0')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* Zoom buttons */}
      <div style={{ position: 'absolute', right: '10px', top: '10px' }}>
        <button className="btn btn-secondary btn-xs" onClick={handleZoomIn}>
          +
        </button>
        <button className="btn btn-secondary btn-xs" onClick={handleZoomOut}>
          –
        </button>
      </div>
    </div>
  );
};

export default Timeline;
