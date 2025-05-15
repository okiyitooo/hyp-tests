export const initialState = {
    // --- Core Test Parameters ---
    testType: 'one-sample-mean', // 'one-sample-mean', 'one-sample-proportion'
    h0Value: 100,                // μ₀ or p₀
    haType: '≠',                 // '≠', '>', '<'
    actualParam: 105,            // μ_actual or p_actual (center of Hₐ distribution)
    sampleSize: 30,              // n
    stdDev: 15,                  // σ (for means test) - will be ignored/disabled for proportions
    alpha: 0.05,                 // Significance level

    // --- Power Interaction ---
    // 'power' itself will be a calculated value, not directly set by user initially,
    // but can be a target when "dragging power"
    parameterToAdjustOnPowerDrag: 'sampleSize', // 'sampleSize', 'effectSize', 'alpha', 'stdDev'

    // --- Calculated Values (to be populated by calculations) ---
    // These will be updated whenever core parameters change or backend responds
    power: null,
    beta: null,
    criticalValue1: null, // For two-tailed or one-sided
    criticalValue2: null, // For two-tailed
    zAlpha: null, // Z-score for alpha
    zBeta: null,  // Z-score for beta (related to power)

    // --- Visualization Data (placeholder structures) ---
    h0DistPoints: [],     // [{x, y}, ...]
    haDistPoints: [],     // [{x, y}, ...]
    type1AreaCoords: [],  // Polygon points for alpha area
    type2AreaCoords: [],  // Polygon points for beta area
    powerAreaCoords: [],  // Polygon points for power area

    // --- UI State for Legend ---
    showH0Distribution: true,
    showHaDistribution: true,
    showAlphaArea: true,
    showBetaArea: true,
    showPowerArea: true,
    showCriticalValues: true,
    showMeanH0: true,
    showMeanHa: true,

    // --- Loading/Error State ---
    isLoading: false,
    error: null,
};

export const appReducer = (state, action) => {
    switch (action.type) {
        case 'SET_PARAM': // Generic action to set any top-level parameter
            return { ...state, [action.payload.param]: action.payload.value };

        case 'SET_TEST_TYPE':
            const isMeanTest = action.payload === 'one-sample-mean';
            return {
                ...state,
                testType: action.payload,
                // Reset stdDev if switching to proportion, or use a default if switching to mean
                stdDev: isMeanTest ? (state.stdDev || 15) : '', // Or null
                h0Value: isMeanTest ? (state.h0Value || 100) : 0.5,
                actualParam: isMeanTest ? (state.actualParam || 105) : 0.6,
            };

        case 'SET_H0_VALUE':
            return { ...state, h0Value: parseFloat(action.payload) || 0 };

        case 'SET_HA_TYPE':
            return { ...state, haType: action.payload };

        case 'SET_ACTUAL_PARAM':
            return { ...state, actualParam: parseFloat(action.payload) || 0 };

        case 'SET_SAMPLE_SIZE':
            const n = parseInt(action.payload, 10);
            return { ...state, sampleSize: n > 0 ? n : 1 }; // Ensure n > 0

        case 'SET_STD_DEV':
            const sd = parseFloat(action.payload);
            return { ...state, stdDev: sd > 0 ? sd : 0.001 }; // Ensure sd > 0

        case 'SET_ALPHA':
            let newAlpha = parseFloat(action.payload);
            if (isNaN(newAlpha) || newAlpha <= 0) newAlpha = 0.001;
            if (newAlpha >= 1) newAlpha = 0.999;
            return { ...state, alpha: newAlpha };

        case 'SET_CONFIDENCE_LEVEL': // This action will set alpha
            let confLevel = parseFloat(action.payload);
            if (isNaN(confLevel) || confLevel <= 0) confLevel = 1; // e.g. 1%
            if (confLevel >= 100) confLevel = 99.9; // e.g. 99.9%
            // Assuming confidence level is always 1 - alpha
            return { ...state, alpha: 1 - (confLevel / 100) };

        case 'SET_PARAMETER_TO_ADJUST':
            return { ...state, parameterToAdjustOnPowerDrag: action.payload };

        case 'TOGGLE_VISIBILITY': // For legend items
            return { ...state, [action.payload.item]: action.payload.checked };

        case 'CALCULATION_START':
            return { ...state, isLoading: true, error: null };

        case 'CALCULATION_SUCCESS':
            return {
                ...state,
                isLoading: false,
                power: action.payload.power,
                beta: action.payload.beta,
                criticalValue1: action.payload.criticalValue1,
                criticalValue2: action.payload.criticalValue2,
                zAlpha: action.payload.zAlpha,
                zBeta: action.payload.zBeta,
                // Potentially update h0DistPoints, haDistPoints etc. here too
                // For now, just core calculated stats
            };
        case 'VISUALIZATION_DATA_UPDATED':
             return {
                ...state,
                h0DistPoints: action.payload.h0DistPoints,
                haDistPoints: action.payload.haDistPoints,
                type1AreaCoords: action.payload.type1AreaCoords,
                type2AreaCoords: action.payload.type2AreaCoords,
                powerAreaCoords: action.payload.powerAreaCoords,
             };

        case 'CALCULATION_ERROR':
            return { ...state, isLoading: false, error: action.payload, power: null, beta: null };

        default:
            return state;
    }
};