import { useAppState, useAppDispatch } from '../context/AppStateContext';

const ControlsPanel = () => {
    const state = useAppState();
    const dispatch = useAppDispatch();

    const {
        testType, h0Value, haType, actualParam,
        sampleSize, stdDev, alpha,
        power, // Display only for now
        parameterToAdjustOnPowerDrag
    } = state;

    const confidenceLevel = ((1 - alpha) * 100).toFixed(1); // Derived for display

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let actionType = `SET_${name.toUpperCase()}`;

        // Special handling for testType due to its impact on other fields
        if (name === "testType") {
            dispatch({ type: 'SET_TEST_TYPE', payload: value });
        } else if (name === "confidenceLevel") {
            dispatch({ type: 'SET_CONFIDENCE_LEVEL', payload: value });
        } else {
            dispatch({ type: actionType, payload: value });
        }
    };
    
    const isMeanTest = testType === 'one-sample-mean';

    return (
        <div className="controls-panel">
            <h2>Controls</h2>

            <div className="control-group">
                <label htmlFor="testType">Test Type:</label>
                <select id="testType" name="testType" value={testType} onChange={handleInputChange}>
                    <option value="one-sample-mean">One-Sample Mean</option>
                    <option value="one-sample-proportion">One-Sample Proportion</option>
                </select>
            </div>

            <div className="control-group">
                <label htmlFor="h0Value">Null Hypothesis (H₀) Value ({isMeanTest ? 'μ₀' : 'p₀'}):</label>
                <input
                    type="number"
                    id="h0Value"
                    name="h0_Value"
                    value={h0Value}
                    onChange={handleInputChange}
                    step={isMeanTest ? "1" : "0.01"}
                    min={isMeanTest ? undefined : "0.01"}
                    max={isMeanTest ? undefined : "0.99"}
                />
            </div>

            <div className="control-group">
                <label htmlFor="haType">Alternative Hypothesis (Hₐ):</label>
                <select id="haType" name="ha_Type" value={haType} onChange={handleInputChange}>
                    <option value="≠">≠ H₀ (Two-tailed)</option>
                    <option value=">">&gt; H₀ (Right-tailed)</option>
                    <option value="<">&lt; H₀ (Left-tailed)</option>
                </select>
            </div>

            <div className="control-group">
                <label htmlFor="actualParam">"Actual" Population Parameter ({isMeanTest ? 'μₐ' : 'pₐ'}):</label>
                <input
                    type="number"
                    id="actualParam"
                    name="actual_Param"
                    value={actualParam}
                    onChange={handleInputChange}
                    step={isMeanTest ? "1" : "0.01"}
                    min={isMeanTest ? undefined : "0.01"}
                    max={isMeanTest ? undefined : "0.99"}
                />
            </div>

            <div className="control-group">
                <label htmlFor="sampleSize">Sample Size (n):</label>
                <input
                    type="number"
                    id="sampleSize"
                    name="sample_Size"
                    value={sampleSize}
                    onChange={handleInputChange}
                    min="1"
                />
                {/* Consider adding a slider later */}
            </div>

            {isMeanTest && (
                <div className="control-group">
                    <label htmlFor="stdDev">Standard Deviation (σ):</label>
                    <input
                        type="number"
                        id="stdDev"
                        name="std_Dev"
                        value={stdDev}
                        onChange={handleInputChange}
                        step="0.1"
                        min="0.001"
                        // disabled={!isMeanTest}
                    />
                </div>
            )}

            <div className="control-group">
                <label htmlFor="alpha">Significance Level (α):</label>
                <input
                    type="number"
                    id="alpha"
                    name="alpha"
                    value={alpha}
                    onChange={handleInputChange}
                    step="0.001"
                    min="0.001"
                    max="0.999"
                />
                 {/* Slider for alpha: <span>{alpha.toFixed(3)}</span>
                 <input type="range" min="0.001" max="0.5" step="0.001" value={alpha} onChange={(e) => dispatch({type: 'SET_ALPHA', payload: e.target.value})} /> */}
            </div>

            <div className="control-group">
                <label htmlFor="confidenceLevel">Confidence Level (%):</label>
                <input
                    type="number"
                    id="confidenceLevel"
                    name="confidenceLevel"
                    value={confidenceLevel} // Display derived value
                    onChange={handleInputChange} // Will dispatch SET_CONFIDENCE_LEVEL
                    step="0.1"
                    min="1"
                    max="99.9"
                />
                <span>(Derived from α: {(100 - alpha * 100).toFixed(1)}%)</span>
            </div>


            <div className="control-group">
                <label>Calculated Power (1-β):</label>
                <span className="display-value">{power !== null ? power.toFixed(3) : 'N/A'}</span>
            </div>

            <div className="control-group">
                <label htmlFor="parameterToAdjustOnPowerDrag">When dragging Power, adjust:</label>
                <select
                    id="parameterToAdjustOnPowerDrag"
                    name="parameterToAdjust"
                    value={parameterToAdjustOnPowerDrag}
                    onChange={(e) => dispatch({type: 'SET_PARAMETER_TO_ADJUST', payload: e.target.value })}
                >
                    <option value="sampleSize">Sample Size (n)</option>
                    <option value="effectSize">Effect Size (Actual Param - H₀)</option>
                    <option value="alpha">Significance Level (α)</option>
                    {isMeanTest && <option value="stdDev">Variability (σ)</option>}
                    {!isMeanTest && <option value="p0_variability">Variability (p₀ for H₀ dist)</option>}
                </select>
            </div>
        </div>
    );
};

export default ControlsPanel;