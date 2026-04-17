'use client';

import { useState } from 'react';

export interface SankeyNode {
  id: string;
  label: string;
  value: number;
  color: string;
  layer: number; // 0 = left (income), 1 = right (spending)
}

export interface SankeyLink {
  sourceId: string;
  targetId: string;
  value: number;
}

interface PositionedNode extends SankeyNode {
  x: number;
  y: number;
  height: number;
}

interface PositionedLink {
  sourceId: string;
  targetId: string;
  value: number;
  color: string;
  // ribbon corners
  sy0: number; // source top y
  sy1: number; // source bottom y
  ty0: number; // target top y
  ty1: number; // target bottom y
  sx: number;  // source right x
  tx: number;  // target left x
}

const NODE_WIDTH = 14;
const NODE_GAP = 10;
const LABEL_WIDTH = 130;
const LABEL_GAP = 8;

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function layoutNodes(
  nodes: SankeyNode[],
  width: number,
  height: number,
): PositionedNode[] {
  const leftNodes = nodes.filter((n) => n.layer === 0).sort((a, b) => b.value - a.value);
  const rightNodes = nodes.filter((n) => n.layer === 1).sort((a, b) => b.value - a.value);

  const totalLeft = leftNodes.reduce((s, n) => s + n.value, 0);
  const totalRight = rightNodes.reduce((s, n) => s + n.value, 0);
  const totalMax = Math.max(totalLeft, totalRight, 1);

  // Available vertical space after node gaps
  function positionColumn(group: SankeyNode[], xPos: number): PositionedNode[] {
    const totalGap = NODE_GAP * (group.length - 1);
    const availH = height - totalGap;
    let yOffset = 0;
    return group.map((n) => {
      const nodeH = Math.max((n.value / totalMax) * availH, 4);
      const positioned: PositionedNode = { ...n, x: xPos, y: yOffset, height: nodeH };
      yOffset += nodeH + NODE_GAP;
      return positioned;
    });
  }

  const leftX = LABEL_WIDTH + LABEL_GAP;
  const rightX = width - LABEL_WIDTH - LABEL_GAP - NODE_WIDTH;

  return [
    ...positionColumn(leftNodes, leftX),
    ...positionColumn(rightNodes, rightX),
  ];
}

function buildLinks(
  nodes: PositionedNode[],
  links: SankeyLink[],
): PositionedLink[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Track current y offsets within each node for stacking links
  const sourceOffsets = new Map<string, number>();
  const targetOffsets = new Map<string, number>();
  nodes.forEach((n) => {
    sourceOffsets.set(n.id, n.y);
    targetOffsets.set(n.id, n.y);
  });

  // Sort links to minimize crossings: group by source, order by target y
  const sortedLinks = [...links].sort((a, b) => {
    const ta = nodeMap.get(a.targetId)?.y ?? 0;
    const tb = nodeMap.get(b.targetId)?.y ?? 0;
    return ta - tb;
  });

  return sortedLinks.map((link) => {
    const src = nodeMap.get(link.sourceId);
    const tgt = nodeMap.get(link.targetId);
    if (!src || !tgt) return null;

    const totalSrc = src.value || 1;
    const totalTgt = tgt.value || 1;

    const srcHeight = (link.value / totalSrc) * src.height;
    const tgtHeight = (link.value / totalTgt) * tgt.height;
    const linkH = Math.max(srcHeight, tgtHeight, 1);

    const sOff = sourceOffsets.get(link.sourceId) ?? src.y;
    const tOff = targetOffsets.get(link.targetId) ?? tgt.y;

    sourceOffsets.set(link.sourceId, sOff + srcHeight);
    targetOffsets.set(link.targetId, tOff + tgtHeight);

    return {
      sourceId: link.sourceId,
      targetId: link.targetId,
      value: link.value,
      color: src.color,
      sy0: sOff,
      sy1: sOff + linkH,
      ty0: tOff,
      ty1: tOff + linkH,
      sx: src.x + NODE_WIDTH,
      tx: tgt.x,
    } as PositionedLink;
  }).filter(Boolean) as PositionedLink[];
}

function ribbonPath(link: PositionedLink): string {
  const midX = (link.sx + link.tx) / 2;
  return [
    `M ${link.sx} ${link.sy0}`,
    `C ${midX} ${link.sy0}, ${midX} ${link.ty0}, ${link.tx} ${link.ty0}`,
    `L ${link.tx} ${link.ty1}`,
    `C ${midX} ${link.ty1}, ${midX} ${link.sy1}, ${link.sx} ${link.sy1}`,
    'Z',
  ].join(' ');
}

interface Props {
  nodes: SankeyNode[];
  links: SankeyLink[];
  height?: number;
}

export function SankeyChart({ nodes, links, height = 420 }: Props) {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Use a fixed width approach; the SVG will be responsive via viewBox
  const width = 700;
  const padV = 12;
  const innerH = height - padV * 2;

  const positioned = layoutNodes(nodes, width, innerH);
  const positionedLinks = buildLinks(positioned, links);
  const nodeMap = new Map(positioned.map((n) => [n.id, n]));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minWidth: 420, height }}
      >
        <g transform={`translate(0, ${padV})`}>
          {/* Links */}
          {positionedLinks.map((link) => {
            const key = `${link.sourceId}-${link.targetId}`;
            const isHovered = hoveredLink === key
              || hoveredNode === link.sourceId
              || hoveredNode === link.targetId;
            return (
              <path
                key={key}
                d={ribbonPath(link)}
                fill={link.color}
                opacity={isHovered ? 0.65 : 0.25}
                onMouseEnter={() => setHoveredLink(key)}
                onMouseLeave={() => setHoveredLink(null)}
                style={{ transition: 'opacity 0.15s', cursor: 'default' }}
              />
            );
          })}

          {/* Nodes */}
          {positioned.map((node) => (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <rect
                x={node.x}
                y={node.y}
                width={NODE_WIDTH}
                height={node.height}
                fill={node.color}
                rx={3}
                opacity={hoveredNode === node.id ? 1 : 0.85}
              />

              {/* Left-side labels (income): right-aligned before the node */}
              {node.layer === 0 && (
                <>
                  <text
                    x={node.x - LABEL_GAP}
                    y={node.y + node.height / 2 - 6}
                    textAnchor="end"
                    fontSize={11}
                    fontWeight={600}
                    fill="#1f2937"
                    dominantBaseline="middle"
                  >
                    {node.label}
                  </text>
                  <text
                    x={node.x - LABEL_GAP}
                    y={node.y + node.height / 2 + 8}
                    textAnchor="end"
                    fontSize={10}
                    fill="#6b7280"
                    dominantBaseline="middle"
                  >
                    {fmt(node.value)}
                  </text>
                </>
              )}

              {/* Right-side labels (spending): left-aligned after the node */}
              {node.layer === 1 && (
                <>
                  <text
                    x={node.x + NODE_WIDTH + LABEL_GAP}
                    y={node.y + node.height / 2 - 6}
                    textAnchor="start"
                    fontSize={11}
                    fontWeight={600}
                    fill="#1f2937"
                    dominantBaseline="middle"
                  >
                    {node.label}
                  </text>
                  <text
                    x={node.x + NODE_WIDTH + LABEL_GAP}
                    y={node.y + node.height / 2 + 8}
                    textAnchor="start"
                    fontSize={10}
                    fill="#6b7280"
                    dominantBaseline="middle"
                  >
                    {fmt(node.value)}
                  </text>
                </>
              )}
            </g>
          ))}

          {/* Hover tooltip for links */}
          {hoveredLink && (() => {
            const link = positionedLinks.find((l) => `${l.sourceId}-${l.targetId}` === hoveredLink);
            if (!link) return null;
            const src = nodeMap.get(link.sourceId);
            const tgt = nodeMap.get(link.targetId);
            if (!src || !tgt) return null;
            const tipX = (link.sx + link.tx) / 2;
            const tipY = (link.sy0 + link.ty0) / 2 - 24;
            return (
              <g>
                <rect x={tipX - 54} y={tipY - 14} width={108} height={22} rx={4} fill="#1f2937" opacity={0.85} />
                <text x={tipX} y={tipY} textAnchor="middle" fontSize={10} fill="white" dominantBaseline="middle">
                  {src.label} → {tgt.label}: {fmt(link.value)}
                </text>
              </g>
            );
          })()}
        </g>
      </svg>
    </div>
  );
}
