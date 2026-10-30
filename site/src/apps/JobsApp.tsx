import {BrowserRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {ColorModeProvider} from './jobs/components/ColorMode';
import {NotifyProvider} from './jobs/components/Notify';
import App from './jobs/App';
const client=new QueryClient({defaultOptions:{queries:{staleTime:30_000,refetchOnWindowFocus:true,retry:1}}});
export default function JobsApp(){return <QueryClientProvider client={client}><ColorModeProvider><NotifyProvider><BrowserRouter basename="/app/jobs" future={{v7_startTransition:true,v7_relativeSplatPath:true}}><App/></BrowserRouter></NotifyProvider></ColorModeProvider></QueryClientProvider>;}
