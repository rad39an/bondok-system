import { useState } from 'react';
import { StoreProvider, useStore } from './store';
import LoginPage from './components/LoginPage';
import WelcomeScreen from './components/WelcomeScreen';
import Layout from './components/Layout';
import Toast from './components/Toast';
import FollowsPage from './components/pages/FollowsPage';
import TimersPage from './components/pages/TimersPage';
import ExpensesPage from './components/pages/ExpensesPage';
import DenominationsPage from './components/pages/DenominationsPage';
import SummaryPage from './components/pages/SummaryPage';
import PilotsPage from './components/pages/PilotsPage';
import DriverFilesPage from './components/pages/DriverFilesPage';
import ClientsPage from './components/pages/ClientsPage';
import ComplaintsPage from './components/pages/ComplaintsPage';
import ArchivePage from './components/pages/ArchivePage';
import SettingsPage from './components/pages/SettingsPage';
import BookingsPage from './components/pages/BookingsPage';

function AppContent() {
  const { currentUser } = useStore();
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentPage, setCurrentPage] = useState('follows');

  if (!currentUser) {
    return <LoginPage onLogin={() => setShowWelcome(true)} />;
  }

  if (showWelcome) {
    return <WelcomeScreen userName={currentUser.responsibleName} onComplete={() => setShowWelcome(false)} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'follows': return <FollowsPage />;
      case 'timers': return <TimersPage />;
      case 'bookings': return <BookingsPage />;
      case 'expenses': return <ExpensesPage />;
      case 'denominations': return <DenominationsPage />;
      case 'summary': return <SummaryPage />;
      case 'pilots': return <PilotsPage />;
      case 'driverfiles': return <DriverFilesPage />;
      case 'clients': return <ClientsPage />;
      case 'complaints': return <ComplaintsPage />;
      case 'archive': return <ArchivePage />;
      case 'settings': return <SettingsPage />;
      default: return <FollowsPage />;
    }
  };

  return (
    <>
      <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
        {renderPage()}
      </Layout>
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
