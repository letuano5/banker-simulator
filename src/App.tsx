import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { BankerPage } from './pages/BankerPage';
import { DeadlockPage } from './pages/DeadlockPage';

type Tab = 'banker' | 'deadlock';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('banker');

  return (
    <ThemeProvider>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {/* Both pages stay mounted so state is preserved on tab switch */}
        <div className={activeTab === 'banker' ? '' : 'hidden'}>
          <BankerPage />
        </div>
        <div className={activeTab === 'deadlock' ? '' : 'hidden'}>
          <DeadlockPage />
        </div>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
