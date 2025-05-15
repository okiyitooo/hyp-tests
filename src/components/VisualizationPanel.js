import { useAppState } from '../context/AppStateContext';

const VisualizationPanel = () => {
    const state = useAppState();
    // Access state.h0DistPoints, state.haDistPoints, etc. to draw charts
    // Access state.criticalValue1, state.criticalValue2 for lines
    // Access state.type1AreaCoords, etc. for shaded areas

    return (
        <div className="visualization-panel">
            <h2>Visualization</h2>
            <p>(Chart will go here)</p>
            <pre style={{fontSize: '10px', maxHeight: '200px', overflow: 'auto'}}>
                {JSON.stringify({
                    h0Value: state.h0Value,
                    actualParam: state.actualParam,
                    alpha: state.alpha,
                    criticalValue1: state.criticalValue1,
                    criticalValue2: state.criticalValue2,
                    power: state.power,
                    beta: state.beta,
                    zAlpha: state.zAlpha,
                    zBeta: state.zBeta
                }, null, 2)}
            </pre>
        </div>
    );
};

export default VisualizationPanel;