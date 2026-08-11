import React from 'react';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

// Helper to render inline markdown styles: **bold**, `inline code`, *italic*
const renderInlineMarkdown = (text: string): React.ReactNode[] => {
  // Regex to split by `code`, **bold**, or *italic*
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700/70 text-indigo-300 font-mono text-[11px] inline-block"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // 1. Separate code blocks from regular markdown text
  const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/g;
  const blocks: { type: 'code' | 'text'; lang?: string; text: string }[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', text: content.slice(lastIndex, match.index) });
    }
    blocks.push({
      type: 'code',
      lang: match[1] || 'typescript',
      text: match[2].trim()
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    blocks.push({ type: 'text', text: content.slice(lastIndex) });
  }

  return (
    <div className={`space-y-2.5 text-xs text-slate-200 leading-relaxed font-sans ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return (
            <div key={idx} className="my-2.5 rounded-xl bg-slate-950 border border-slate-800 p-3 overflow-x-auto font-mono text-[11px]">
              <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-1.5 font-sans font-bold flex items-center justify-between">
                <span>{block.lang}</span>
                <span className="text-slate-600">code snippet</span>
              </div>
              <pre className="text-emerald-400 whitespace-pre">{block.text}</pre>
            </div>
          );
        }

        // Render text block lines (headings, blockquotes, tables, lists, paragraphs)
        const lines = block.text.split('\n');
        const renderedElements: React.ReactNode[] = [];
        let inList = false;
        let listItems: React.ReactNode[] = [];
        let tableRows: string[] = [];

        const flushList = () => {
          if (inList && listItems.length > 0) {
            renderedElements.push(
              <ul key={`ul-${renderedElements.length}`} className="space-y-1.5 my-1.5 pl-4 list-disc text-slate-200">
                {listItems}
              </ul>
            );
            listItems = [];
            inList = false;
          }
        };

        const flushTable = () => {
          if (tableRows.length > 0) {
            const rows = tableRows.filter(r => !r.includes('---'));
            if (rows.length > 0) {
              const headerCols = rows[0].split('|').filter(c => c.trim().length > 0);
              const bodyRows = rows.slice(1).map(r => r.split('|').filter(c => c.trim().length > 0));

              renderedElements.push(
                <div key={`table-${renderedElements.length}`} className="my-3 overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold">
                        {headerCols.map((col, i) => (
                          <th key={i} className="p-2 px-3">{renderInlineMarkdown(col.trim())}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bodyRows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2 px-3 text-slate-300">{renderInlineMarkdown(cell.trim())}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            tableRows = [];
          }
        };

        lines.forEach((line, lineIdx) => {
          const trimmed = line.trim();

          // Markdown Table Row
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            flushList();
            tableRows.push(trimmed);
            return;
          } else {
            flushTable();
          }

          // Blockquote / Offline Banner (> ⚠️ ...)
          if (trimmed.startsWith('>')) {
            flushList();
            const quoteContent = trimmed.replace(/^>\s*/, '');
            renderedElements.push(
              <div
                key={`quote-${lineIdx}`}
                className="my-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2 shadow-sm font-sans"
              >
                <div>{renderInlineMarkdown(quoteContent)}</div>
              </div>
            );
            return;
          }

          // Headings
          if (trimmed.startsWith('### ')) {
            flushList();
            renderedElements.push(
              <h3 key={`h3-${lineIdx}`} className="text-sm font-bold text-indigo-300 mt-3 mb-1 font-sans border-b border-slate-800 pb-1">
                {renderInlineMarkdown(trimmed.slice(4))}
              </h3>
            );
            return;
          }
          if (trimmed.startsWith('## ')) {
            flushList();
            renderedElements.push(
              <h2 key={`h2-${lineIdx}`} className="text-base font-bold text-white mt-4 mb-1.5 font-sans">
                {renderInlineMarkdown(trimmed.slice(3))}
              </h2>
            );
            return;
          }
          if (trimmed.startsWith('# ')) {
            flushList();
            renderedElements.push(
              <h1 key={`h1-${lineIdx}`} className="text-lg font-black text-white mt-4 mb-2 font-sans">
                {renderInlineMarkdown(trimmed.slice(2))}
              </h1>
            );
            return;
          }

          // Bullet List Items
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            inList = true;
            listItems.push(
              <li key={`li-${lineIdx}`} className="text-slate-200 leading-relaxed">
                {renderInlineMarkdown(trimmed.slice(2))}
              </li>
            );
            return;
          } else {
            flushList();
          }

          // Regular Non-Empty Paragraph
          if (trimmed.length > 0) {
            renderedElements.push(
              <p key={`p-${lineIdx}`} className="my-1 text-slate-200">
                {renderInlineMarkdown(trimmed)}
              </p>
            );
          }
        });

        flushList();
        flushTable();

        return <React.Fragment key={idx}>{renderedElements}</React.Fragment>;
      })}
    </div>
  );
};
