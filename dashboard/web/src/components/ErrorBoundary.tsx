import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';

interface Props { children: ReactNode; resetKey?: unknown }
interface State { error: Error | null }

/** Catches render errors in one page so the rest of the app keeps working. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error, info: ErrorInfo) { console.warn('Page crashed:', error, info.componentStack); }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={<Button color="inherit" onClick={() => this.setState({ error: null })}>Try again</Button>}>
          <AlertTitle>Something went wrong on this page</AlertTitle>
          {this.state.error.message}
        </Alert>
      </Box>
    );
  }
}
