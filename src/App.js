import React, { useEffect } from 'react';
import { AppStateProvider, useAppState, useAppDispatch } from './context/AppStateContext';
import ControlsPanel from './components/ControlsPanel';
import VisualizationPanel from './components/VisualizationPanel';
import LegendPanel from './components/LegendPanel';
import './styles.css'; 

const AppContent = () => {
    const state = useAppState();
    const dispatch = useAppDispatch();

    const {
        testType, h0Value, haType, actualParam,
        sampleSize, stdDev, alpha
    } = state;

    useEffect(() => {
        console.log("Parameters changed, recalculate:", {
            testType, h0Value, haType, actualParam, sampleSize, stdDev, alpha
        });

        // Example: If we had a client-side calculation function
        // dispatch({ type: 'CALCULATION_START' });
        // try {
        //     const results = calculateStats({ /* pass current params */ });
        //     dispatch({ type: 'CALCULATION_SUCCESS', payload: results });
        //     const vizData = generateVisualizationData(results, state);
        //     dispatch({ type: 'VISUALIZATION_DATA_UPDATED', payload: vizData });
        // } catch (err) {
        //     dispatch({ type: 'CALCULATION_ERROR', payload: err.message });
        // }

        // If using backend:
        // async function fetchData() {
        //   dispatch({ type: 'CALCULATION_START' });
        //   try {
        //     const response = await fetch('/api/calculate-power', {
        //       method: 'POST',
        //       headers: { 'Content-Type': 'application/json' },
        //       body: JSON.stringify({ testType, h0Value, haType, actualParam, sampleSize, stdDev, alpha })
        //     });
        //     if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        //     const data = await response.json();
        //     dispatch({ type: 'CALCULATION_SUCCESS', payload: data }); // Assuming backend returns power, beta, critical values
        //     dispatch({ type: 'VISUALIZATION_DATA_UPDATED', payload: { // And also visualization points
        //        h0DistPoints: data.h0DistPoints,
        //        haDistPoints: data.haDistPoints,
        //        // ... etc.
        //     }});
        //   } catch (error) {
        //     dispatch({ type: 'CALCULATION_ERROR', payload: error.message });
        //   }
        // }
        // fetchData();

    }, [testType, h0Value, haType, actualParam, sampleSize, stdDev, alpha, dispatch]);

    return (
        <div className="app-container">
            <header>
                <h1>Interactive Hypothesis Test Visualizer</h1>
            </header>
            <main>
                <ControlsPanel />
                <VisualizationPanel />
            </main>
            <aside>
                <LegendPanel />
            </aside>
            <footer>
                {state.isLoading && <p>Calculating...</p>}
                {state.error && <p style={{ color: 'red' }}>Error: {state.error}</p>}
            </footer>
        </div>
    );
};

function App() {
    return (
        <AppStateProvider>
            <AppContent />
        </AppStateProvider>
    );
}

export default App;