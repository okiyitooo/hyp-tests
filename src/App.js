import React, { useEffect } from 'react';
import { AppStateProvider, useAppState, useAppDispatch } from './context/AppStateContext';
import ControlsPanel from './components/ControlsPanel';
import VisualizationPanel from './components/VisualizationPanel';
import LegendPanel from './components/LegendPanel';
import { calculateStats, generateDistributionPoints, generateAllAreaPoints } from './utils/calculations';
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
        dispatch({ type: 'CALCULATION_START' });
        const calculationParams = {
            testType, h0Value, haType, actualParam,
            sampleSize, stdDev: testType.includes('sample-mean') ? stdDev : null, // Pass stdDev only for mean test
            alpha
        };
        const results = calculateStats(calculationParams);

        if (results.error) {
            dispatch({ type: 'CALCULATION_ERROR', payload: results.error });
            // Clear all visualization data on error
            dispatch({
                type: 'VISUALIZATION_DATA_UPDATED',
                payload: {
                    h0DistPoints: [],
                    haDistPoints: [],
                    alphaAreaPoints: [],
                    betaAreaPoints: [],
                    powerAreaPoints: [],
                }
            });
        } else {
          dispatch({ type: 'CALCULATION_SUCCESS', payload: results });

          // Generate points for distributions if calculations were successful
          // Use calculated standard errors for generating points
          const h0Points = generateDistributionPoints(
                results.h0Value !== undefined ? results.h0Value : h0Value, // Use result if available, else from state
                results.standardErrorH0
            );
            const haPoints = generateDistributionPoints(
                results.actualParam !== undefined ? results.actualParam : actualParam, // Use result if available
                results.standardErrorHa
            );
            const areaParams = {
                h0Value: results.h0Value !== undefined ? results.h0Value : h0Value,
                actualParam: results.actualParam !== undefined ? results.actualParam : actualParam,
                standardErrorH0: results.standardErrorH0,
                standardErrorHa: results.standardErrorHa,
                criticalValue1: results.criticalValue1,
                criticalValue2: results.criticalValue2,
                haType: haType // haType is from state, not typically in 'results' from calculateStats
            };

            const areas = generateAllAreaPoints(areaParams, h0Points, haPoints);
            dispatch({
                type: 'VISUALIZATION_DATA_UPDATED',
                payload: {
                    h0DistPoints: h0Points,
                    haDistPoints: haPoints,
                    alphaAreaPoints: areas.alphaAreaPoints,
                    betaAreaPoints: areas.betaAreaPoints,
                    powerAreaPoints: areas.powerAreaPoints,
                }
            });
        }

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
            <div className="main-content-area"> {/* New wrapper */}
                <div className="controls-column"> {/* New wrapper for left side */}
                    <ControlsPanel />
                    <LegendPanel />
                </div>

                <div className="visualization-column"> {/* New wrapper for right side */}
                    <VisualizationPanel /> {/* VisualizationPanel will contain the chart-container div */}
                </div>
            </div>
            <footer>
                {state.isLoading && <p>Calculating...</p>}
                {state.error && <p style={{ color: 'red' }}>Error: {state.error}</p>}
                {!state.isLoading && !state.error && (
                    <div style={{ fontSize: '0.8em', marginTop: '10px', padding:'5px', background:'#eee',  overflowY: 'auto' }}>
                        <p>Power: {state.power?.toFixed(4)}, Beta: {state.beta?.toFixed(4)}, Alpha: {state.alpha?.toFixed(4)}</p>
                        <p>CV1: {state.criticalValue1?.toFixed(4)}, CV2: {state.criticalValue2?.toFixed(4)}</p>
                        <p>SE H0: {state.standardErrorH0?.toFixed(4)}, SE Ha: {state.standardErrorHa?.toFixed(4)}</p>
                        <p>α points: {state.alphaAreaPoints?.length}, β points: {state.betaAreaPoints?.length}, Power sets: {Array.isArray(state.powerAreaPoints) ? state.powerAreaPoints.length : 0} </p>
                        {/* <p>Power points: {JSON.stringify(state.powerAreaPoints)}</p> */}
                        @hyp-tests
                        <p>2023</p>
                        <p>All rights reserved</p>
                        <p>Powered by React</p>
                        {/* text saying "made with ❤️", when the heart is hovered over, a tooltip should say blood and sweat */}
                        <div style={{ display: 'inline-block', position: 'relative' }}>
                            Made with 
                            <div role="img" aria-label="heart" style={{ margin: '0 5px' }} className="tooltip">❤️
                                <span className="tooltip-text">Blood and Sweat</span>
                            </div>
                        </div>
                        <p>Check out the code on GitHub</p>
                        <p>Made by <a target="_blank" href="https://github.com/okiyitooo">kanaetochi</a></p>
                    </div>
                )}
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