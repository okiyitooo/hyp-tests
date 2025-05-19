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
    standardErrorH0: null, // Standard error for H₀
    standardErrorHa: null, // Standard error for Hₐ

    // --- Visualization Data (placeholder structures) ---
    h0DistPoints: [],     // [{x, y}, ...]
    haDistPoints: [],     // [{x, y}, ...]
    alphaAreaPoints: [],
    betaAreaPoints: [],
    powerAreaPoints: [], // Can be one or two arrays for two-tailed


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
            const isMeanTest = action.payload.includes('sample-mean');
            const newH0 = isMeanTest ? (state.h0Value || 100) : 0.5; // Default for proportion
            const newActual = isMeanTest ? (state.actualParam || 105) : 0.5; // Default for proportion
            return {
                ...state,
                testType: action.payload,
                // Reset stdDev if switching to proportion, or use a default if switching to mean
                stdDev: isMeanTest ? (state.stdDev || 15) : '', // Or null
                h0Value: newH0,
                actualParam: newActual,
                power: null,
                beta: null,
                criticalValue1: null,
                criticalValue2: null,
                zAlpha: null,
                standardErrorH0: null,
                standardErrorHa: null,
                h0DistPoints: [],
                haDistPoints: [],
                alphaAreaPoints: [],
                betaAreaPoints: [],
                powerAreaPoints: [],
            };

        case 'SET_H0_VALUE':
            let h0Val = parseFloat(action.payload);
            if (state.testType.includes('sample-proportion')) {
                if (isNaN(h0Val) || h0Val <= 0) h0Val = 0.01;
                if (h0Val >= 1) h0Val = 0.99;
            }
            return { ...state, h0Value: h0Val || 0 };

        case 'SET_HA_TYPE':
            return { ...state, haType: action.payload };

        case 'SET_ACTUAL_PARAM':
            let actualVal = parseFloat(action.payload);
            if (state.testType.includes('sample-proportion')) {
                if (isNaN(actualVal) || actualVal <= 0) actualVal = 0.01;
                if (actualVal >= 1) actualVal = 0.99;
            }
            return { ...state, actualParam: actualVal || 0 };

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
                error: action.payload.error || null,
                power: action.payload.error ? null : action.payload.power,
                beta: action.payload.error ? null : action.payload.beta,
                criticalValue1: action.payload.error ? null : action.payload.criticalValue1,
                criticalValue2: action.payload.error ? null : action.payload.criticalValue2,
                zAlpha: action.payload.error ? null : action.payload.zAlpha,
                standardErrorH0: action.payload.error ? null : action.payload.standardErrorH0,
                standardErrorHa: action.payload.error ? null : action.payload.standardErrorHa,
                // Potentially update h0DistPoints, haDistPoints etc. here too
                h0DistPoints: action.payload.h0DistPoints || [],
                haDistPoints: action.payload.haDistPoints || [],
                alphaAreaPoints: action.payload.alphaAreaPoints || [],
                betaAreaPoints: action.payload.betaAreaPoints || [],
                powerAreaPoints: action.payload.powerAreaPoints || [],
                // For now, just core calculated stats
            };
        case 'VISUALIZATION_DATA_UPDATED':
             return {
                ...state,
                h0DistPoints: action.payload.h0DistPoints,
                haDistPoints: action.payload.haDistPoints,
                powerAreaPoints: action.payload.powerAreaPoints,
                alphaAreaPoints: action.payload.alphaAreaPoints,
                betaAreaPoints: action.payload.betaAreaPoints,
             };

        case 'CALCULATION_ERROR':
            return { 
                ...state, 
                isLoading: false, 
                error: action.payload, 
                power: null, 
                beta: null, 
                h0DistPoints: [],
                haDistPoints: [],
                alphaAreaPoints: [],
                betaAreaPoints: [],
                powerAreaPoints: [],
            };

        default:
            return state;
    }
};