import { useAppState, useAppDispatch } from '../context/AppStateContext';

const LegendPanel = () => {
    const state = useAppState();
    const dispatch = useAppDispatch();

    const legendItems = [
        { key: 'showH0Distribution', label: 'H₀ Distribution' },
        { key: 'showHaDistribution', label: 'Hₐ Distribution' },
        { key: 'showAlphaArea', label: 'Type I Error Area (α)' },
        { key: 'showBetaArea', label: 'Type II Error Area (β)' },
        { key: 'showPowerArea', label: 'Power Area (1-β)' },
        { key: 'showCriticalValues', label: 'Critical Value(s)' },
        { key: 'showMeanH0', label: 'Mean of H₀' },
        { key: 'showMeanHa', label: 'Mean of Hₐ' },
    ];

    const handleCheckboxChange = (itemKey, checked) => {
        dispatch({ type: 'TOGGLE_VISIBILITY', payload: { item: itemKey, checked } });
    };

    return (
        <div className="legend-panel">
            <h3>Legend & Toggles</h3>
            {legendItems.map(item => (
                <div key={item.key} className="legend-item">
                    <input
                        type="checkbox"
                        id={item.key}
                        checked={state[item.key]}
                        onChange={(e) => handleCheckboxChange(item.key, e.target.checked)}
                    />
                    <label htmlFor={item.key}>{item.label}</label>
                </div>
            ))}
        </div>
    );
};

export default LegendPanel;