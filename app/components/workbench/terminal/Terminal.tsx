import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Terminal as XTerm } from '@xterm/xterm';
import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Theme } from '~/lib/stores/theme';
import { createScopedLogger } from '~/utils/logger';
import { getTerminalTheme } from './theme';
import '~/styles/components/terminal-copy.css';

const logger = createScopedLogger('Terminal');

export interface TerminalRef {
  reloadStyles: () => void;
}

export interface TerminalProps {
  className?: string;
  theme: Theme;
  readonly?: boolean;
  id: string;
  onTerminalReady?: (terminal: XTerm) => void;
  onTerminalResize?: (cols: number, rows: number) => void;
}

export const Terminal = memo(
  forwardRef<TerminalRef, TerminalProps>(
    ({ className, theme, readonly, id, onTerminalReady, onTerminalResize }, ref) => {
      const terminalElementRef = useRef<HTMLDivElement>(null);
      const terminalRef = useRef<XTerm>();
      const [copied, setCopied] = useState(false);

      useEffect(() => {
        const element = terminalElementRef.current!;

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        const terminal = new XTerm({
          cursorBlink: true,
          convertEol: true,
          disableStdin: readonly,
          theme: getTerminalTheme(readonly ? { cursor: '#00000000' } : {}),
          fontSize: 12,
          fontFamily: 'Menlo, courier-new, courier, monospace',
        });

        terminalRef.current = terminal;

        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.open(element);

        const resizeObserver = new ResizeObserver(() => {
          fitAddon.fit();
          onTerminalResize?.(terminal.cols, terminal.rows);
        });

        resizeObserver.observe(element);

        logger.debug(`Attach [${id}]`);

        onTerminalReady?.(terminal);

        return () => {
          resizeObserver.disconnect();
          terminal.dispose();
        };
      }, []);

      useEffect(() => {
        const terminal = terminalRef.current!;

        // we render a transparent cursor in case the terminal is readonly
        terminal.options.theme = getTerminalTheme(readonly ? { cursor: '#00000000' } : {});

        terminal.options.disableStdin = readonly;
      }, [theme, readonly]);

      useImperativeHandle(ref, () => {
        return {
          reloadStyles: () => {
            const terminal = terminalRef.current!;
            terminal.options.theme = getTerminalTheme(readonly ? { cursor: '#00000000' } : {});
          },
        };
      }, []);

      function copyTerminalContent() {
        const terminal = terminalRef.current;

        if (!terminal) {
          return;
        }

        // Get all lines from the terminal buffer
        const lines = [];

        for (let i = 0; i < terminal.buffer.active.length; i++) {
          const line = terminal.buffer.active.getLine(i);

          if (line) {
            lines.push(line.translateToString(true));
          }
        }

        const text = lines.join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }

      return (
        <div className={`terminal-copy-wrapper ${className ?? ''}`} ref={terminalElementRef}>
          <button className="terminal-copy-btn" onClick={copyTerminalContent} title="Copy terminal contents">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      );
    },
  ),
);
