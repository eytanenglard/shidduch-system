'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  locale?: string;
}

interface State {
  hasError: boolean;
}

export default class HeartMapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[HeartMap] Error caught by boundary:', error);
  }

  render() {
    if (this.state.hasError) {
      const isRTL = this.props.locale === 'he';
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              {isRTL ? 'אופס, משהו השתבש' : 'Oops, something went wrong'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {isRTL
                ? 'התשובות שלכם שמורות. נסו לרענן את הדף.'
                : 'Your answers are saved. Try refreshing the page.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-teal-500 text-white font-medium text-sm hover:bg-teal-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {isRTL ? 'רענון' : 'Refresh'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
