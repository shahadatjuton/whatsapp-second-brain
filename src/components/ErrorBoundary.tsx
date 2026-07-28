import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { logger } from '@/utils/logger';
import { Button } from './ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional label to identify which region failed (e.g. section name). */
  label?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Class-based error boundary. Each section is wrapped independently so a single
 * failing feature degrades to an inline message instead of blanking the whole
 * sidebar (PRD "Never crash").
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error(`Render error${this.props.label ? ` in ${this.props.label}` : ''}:`, error, info);
  }

  private readonly reset = (): void => this.setState({ error: null });

  public render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">
              Something went wrong
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              This section hit an error. Your data is safe.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={this.reset}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
