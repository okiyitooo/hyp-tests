import jStat from 'jstat';

export const calculateStats = (params) => {
    const {
        testType,
        h0Value,      // μ₀ or p₀
        haType,       // '≠', '>', '<'
        actualParam,  // μ_actual or p_actual
        sampleSize,   // n
        stdDev,       // σ (for means test)
        alpha,        // Significance level
    } = params;

    if (sampleSize <= 0) {
        return { error: "Sample size must be greater than 0." };
    }
    if (testType === 'one-sample-mean' && stdDev <= 0) {
        return { error: "Standard deviation must be greater than 0 for a means test." };
    }
    if (alpha <= 0 || alpha >= 1) {
        return { error: "Alpha must be between 0 and 1 (exclusive)." };
    }
    if (testType === 'one-sample-proportion') {
        if (h0Value <= 0 || h0Value >= 1) return { error: "H0 proportion (p₀) must be between 0 and 1." };
        if (actualParam <= 0 || actualParam >= 1) return { error: "Actual proportion (pₐ) must be between 0 and 1." };
        // Check for np > 5 and n(1-p) > 5 for normality assumption (optional, but good practice)
        if (sampleSize * h0Value < 5 || sampleSize * (1 - h0Value) < 5) {
            console.warn(`Normality assumption for H0 (np₀ >= 5, n(1-p₀) >= 5) might not be met: np₀=${(sampleSize * h0Value).toFixed(2)}, n(1-p₀)=${(sampleSize * (1 - h0Value)).toFixed(2)}`);
        }
         if (sampleSize * actualParam < 5 || sampleSize * (1 - actualParam) < 5) {
            console.warn(`Normality assumption for Ha (npₐ >= 5, n(1-pₐ) >= 5) might not be met: npₐ=${(sampleSize * actualParam).toFixed(2)}, n(1-pₐ)=${(sampleSize * (1 - actualParam)).toFixed(2)}`);
        }
    }


    let zAlpha, criticalValue1 = null, criticalValue2 = null;
    let standardErrorH0, standardErrorHa;

    if (testType === 'one-sample-mean') {
        standardErrorH0 = stdDev / Math.sqrt(sampleSize);
        standardErrorHa = stdDev / Math.sqrt(sampleSize); // Assuming sigma is the same for H0 and Ha
    } else { // one-sample-proportion
        if (h0Value * (1 - h0Value) < 0) return { error: "Invalid H0 proportion for SE calculation."};
        standardErrorH0 = Math.sqrt(h0Value * (1 - h0Value) / sampleSize);
        if (actualParam * (1 - actualParam) < 0) return { error: "Invalid Actual proportion for SE calculation."};
        standardErrorHa = Math.sqrt(actualParam * (1 - actualParam) / sampleSize);
        if (standardErrorH0 === 0 || standardErrorHa === 0) {
            // This can happen if p0 or p_actual is 0 or 1.
            // Power calculation becomes tricky (either 0 or 1 depending on critical value placement)
            // For simplicity, we'll return an error or very small SE.
            // Here, let's assume the reducer already validated p0 and actualParam to be >0 and <1.
            // If not, and SE is zero, this needs careful handling.
            // For now, let's say the input validation for p0/actualParam in reducer should prevent this.
            return { error: "Standard error is zero. Check H0 and actual proportions." };
        }
    }
    if (isNaN(standardErrorH0) || isNaN(standardErrorHa)) {
        return { error: "Standard error calculation resulted in NaN. Check inputs (e.g., p(1-p) < 0 or n=0)." };
    }


    // --- Calculate Critical Value(s) based on H0 ---
    if (haType === '≠') { // Two-tailed
        zAlpha = Math.abs(jStat.normal.inv(alpha / 2, 0, 1));
        criticalValue1 = h0Value - zAlpha * standardErrorH0;
        criticalValue2 = h0Value + zAlpha * standardErrorH0;
    } else if (haType === '>') { // Right-tailed (Hₐ: param > h0Value)
        zAlpha = Math.abs(jStat.normal.inv(alpha, 0, 1)); // alpha in upper tail
        criticalValue1 = h0Value + zAlpha * standardErrorH0; // Single critical value
    } else { // Left-tailed (Hₐ: param < h0Value)
        zAlpha = Math.abs(jStat.normal.inv(alpha, 0, 1)); // alpha in lower tail
        criticalValue1 = h0Value - zAlpha * standardErrorH0; // Single critical value
    }

    // --- Calculate Beta and Power based on Ha ---
    let beta, power;

    if (standardErrorHa === 0) { // Edge case: No variability in Ha distribution
        // This occurs if p_actual is 0 or 1 for proportions.
        // If actualParam is in rejection region, power = 1, beta = 0
        // If actualParam is in acceptance region, power = 0, beta = 1
        if (haType === '≠') {
            power = (actualParam < criticalValue1 || actualParam > criticalValue2) ? 1 : 0;
        } else if (haType === '>') {
            power = (actualParam > criticalValue1) ? 1 : 0;
        } else { // haType === '<'
            power = (actualParam < criticalValue1) ? 1 : 0;
        }
        beta = 1 - power;
    } else {
        if (haType === '≠') {
            // Beta is the area under Ha between criticalValue1 and criticalValue2
            const zForCV1_onHa = (criticalValue1 - actualParam) / standardErrorHa;
            const zForCV2_onHa = (criticalValue2 - actualParam) / standardErrorHa;
            beta = jStat.normal.cdf(zForCV2_onHa, 0, 1) - jStat.normal.cdf(zForCV1_onHa, 0, 1);
        } else if (haType === '>') { // Hₐ: param > h0Value, Rejection region is X > CV1
            // Beta is P(X <= CV1 | Hₐ is true)
            const zForCV1_onHa = (criticalValue1 - actualParam) / standardErrorHa;
            beta = jStat.normal.cdf(zForCV1_onHa, 0, 1);
        } else { // haType === '<', Hₐ: param < h0Value, Rejection region is X < CV1
            // Beta is P(X >= CV1 | Hₐ is true)
            const zForCV1_onHa = (criticalValue1 - actualParam) / standardErrorHa;
            beta = 1 - jStat.normal.cdf(zForCV1_onHa, 0, 1);
        }
    }


    // Ensure beta is within [0, 1] due to potential floating point inaccuracies
    beta = Math.max(0, Math.min(1, beta));
    power = 1 - beta;

    return {
        power,
        beta,
        criticalValue1,
        criticalValue2,
        zAlpha, // This is the magnitude of the z-score for alpha (e.g., 1.96)
        standardErrorH0,
        standardErrorHa,
        error: null, // No error
    };
};

// Helper to generate points for a normal distribution curve
export const generateDistributionPoints = (mean, stdError, numPoints = 200, rangeMultiplier = 4) => {
    if (stdError <= 0 || isNaN(stdError) || !isFinite(stdError)) {
        // Handle edge case: if stdError is 0 or invalid, return a spike at the mean
        // Or, for visualization, perhaps a very narrow distribution or just the mean line
        // For now, return a limited set of points representing a spike if stdError is effectively zero
        const yMax = 1; // Arbitrary height for a spike
        return [
            { x: mean - 0.001, y: 0 },
            { x: mean, y: yMax },
            { x: mean + 0.001, y: 0 },
        ];
    }

    const points = [];
    const minX = mean - rangeMultiplier * stdError;
    const maxX = mean + rangeMultiplier * stdError;
    const step = (maxX - minX) / numPoints;

    for (let i = 0; i <= numPoints; i++) {
        const x = minX + i * step;
        const y = jStat.normal.pdf(x, mean, stdError);
        points.push({ x, y });
    }
    return points;
};

export const generateAreaPoints = (mean, stdError, xMin, xMax, numPoints = 50) => {
    if (xMin >= xMax || stdError <= 0 || isNaN(stdError) || !isFinite(stdError)) {
        return []; // No area or invalid distribution
    }

    const points = [];
    const step = (xMax - xMin) / numPoints;

    // Start with the base at xMin
    points.push({ x: xMin, y: 0 });

    for (let i = 0; i <= numPoints; i++) {
        const x = xMin + i * step;
        const y = jStat.normal.pdf(x, mean, stdError);
        points.push({ x, y });
    }

    points.push({ x: xMax, y: 0 });

    const curvePoints = [];
    if (numPoints > 0) {
        for (let i = 0; i <= numPoints; i++) {
            const x = xMin + i * step;
            const y = jStat.normal.pdf(x, mean, stdError);
            curvePoints.push({ x, y });
        }
    } else { // If numPoints is 0, just use xMin and xMax
        curvePoints.push({ x: xMin, y: jStat.normal.pdf(xMin, mean, stdError) });
        curvePoints.push({ x: xMax, y: jStat.normal.pdf(xMax, mean, stdError) });
    }

    return curvePoints;
};

export const generateAllAreaPoints = (calcResults, h0DistPoints, haDistPoints) => {
    const {
        h0Value, actualParam,
        standardErrorH0, standardErrorHa,
        criticalValue1, criticalValue2,
        haType
    } = calcResults;

    let alphaAreaPoints = []; // Will be [points] or [[left_points], [right_points]]
    let betaAreaPoints = [];
    let powerAreaPoints = []; // Will be [points] or [[left_points], [right_points]]

    const allDistXValues = [
        ...(h0DistPoints || []).map(p => p.x),
        ...(haDistPoints || []).map(p => p.x)
    ];

    // Define a broader range to ensure areas are fully drawn even if CVs are far out
    let overallMinX = h0Value - 5 * standardErrorH0; // Extend further
    let overallMaxX = h0Value + 5 * standardErrorH0;
    if (actualParam && standardErrorHa) { // Consider Ha distribution range too
        overallMinX = Math.min(overallMinX, actualParam - 5 * standardErrorHa);
        overallMaxX = Math.max(overallMaxX, actualParam + 5 * standardErrorHa);
    }
    if (allDistXValues.length > 0) {
         overallMinX = Math.min(overallMinX, ...allDistXValues);
         overallMaxX = Math.max(overallMaxX, ...allDistXValues);
    }
    // --- Alpha Area (under H0 curve in rejection region) ---
    if (criticalValue1 !== null && standardErrorH0 > 0) {
        if (haType === '≠') { // Two-tailed - alphaAreaPoints becomes an array of arrays
            const alphaAreaLeft = [];
            const alphaAreaRight = [];

            // Left tail
            const xMinAlphaLeft = overallMinX;
            const xMaxAlphaLeft = criticalValue1;
            if (xMinAlphaLeft < xMaxAlphaLeft) {
                alphaAreaLeft.push(...generateAreaPoints(h0Value, standardErrorH0, xMinAlphaLeft, xMaxAlphaLeft));
            }
            if (alphaAreaLeft.length > 0) {
                alphaAreaPoints.push(alphaAreaLeft);
            }

            // Right tail
            const xMinAlphaRight = criticalValue2;
            const xMaxAlphaRight = overallMaxX;
            if (xMinAlphaRight < xMaxAlphaRight) {
                alphaAreaRight.push(...generateAreaPoints(h0Value, standardErrorH0, xMinAlphaRight, xMaxAlphaRight));
            }
            if (alphaAreaRight.length > 0) {
                alphaAreaPoints.push(alphaAreaRight);
            }
            // If only one tail had points (e.g. CV1 or CV2 is way off), ensure it's still wrapped if it was intended to be multi
            // The VisualizationPanel handles single vs multi based on Array.isArray(points[0]) anyway.
            // If alphaAreaPoints ends up with only one sub-array, viz panel will treat it as if it was [points].

        } else if (haType === '>') { // Right-tailed (reject if > CV1)
            const xMinAlpha = criticalValue1;
            const xMaxAlpha = overallMaxX;
            if (xMinAlpha < xMaxAlpha) {
                alphaAreaPoints = generateAreaPoints(h0Value, standardErrorH0, xMinAlpha, xMaxAlpha);
            }
        } else { // Left-tailed (haType === '<') (reject if < CV1)
            const xMinAlpha = overallMinX;
            const xMaxAlpha = criticalValue1;
            if (xMinAlpha < xMaxAlpha) {
                alphaAreaPoints = generateAreaPoints(h0Value, standardErrorH0, xMinAlpha, xMaxAlpha);
            }
        }
    }

    // --- Beta Area (under Ha curve in acceptance region) ---
    if (criticalValue1 !== null && standardErrorHa > 0) {
        if (haType === '≠') { // Two-tailed (Acceptance region is between CV1 and CV2)
            const xMinBeta = criticalValue1;
            const xMaxBeta = criticalValue2;
            if (xMinBeta < xMaxBeta) {
                betaAreaPoints = generateAreaPoints(actualParam, standardErrorHa, xMinBeta, xMaxBeta);
            }
        } else if (haType === '>') { // Right-tailed (Acceptance region is X <= CV1)
            const xMinBeta = overallMinX; // More accurately, start from far left of Ha dist
            const xMaxBeta = criticalValue1;
             if (xMinBeta < xMaxBeta) {
                betaAreaPoints = generateAreaPoints(actualParam, standardErrorHa, xMinBeta, xMaxBeta);
            }
        } else { // Left-tailed (haType === '<') (Acceptance region is X >= CV1)
            const xMinBeta = criticalValue1;
            const xMaxBeta = overallMaxX; // More accurately, end at far right of Ha dist
            if (xMinBeta < xMaxBeta) {
                betaAreaPoints = generateAreaPoints(actualParam, standardErrorHa, xMinBeta, xMaxBeta);
            }
        }
    }


    // --- Power Area (under Ha curve in rejection region) ---
    if (criticalValue1 !== null && standardErrorHa > 0) {
        if (haType === '≠') { // Two-tailed (Rejection region is X < CV1 OR X > CV2)
            const powerAreaLeft = [];
            const powerAreaRight = [];
            // Left tail of power
            const xMinPowerLeft = overallMinX; // from far left of Ha
            const xMaxPowerLeft = criticalValue1;
            if (xMinPowerLeft < xMaxPowerLeft) {
                powerAreaLeft.push(...generateAreaPoints(actualParam, standardErrorHa, xMinPowerLeft, xMaxPowerLeft));
            }

            // Right tail of power
            const xMinPowerRight = criticalValue2;
            const xMaxPowerRight = overallMaxX; // to far right of Ha
            if (xMinPowerRight < xMaxPowerRight) {
                 powerAreaRight.push(...generateAreaPoints(actualParam, standardErrorHa, xMinPowerRight, xMaxPowerRight));
            }

            // For two-tailed power, we need to pass two separate arrays of points
            // if we want to draw them as distinct areas or ensure they are handled correctly.
            // Our VisualizationPanel is set up to handle powerAreaPoints as an array of arrays.
            if (powerAreaLeft.length > 0) powerAreaPoints.push(powerAreaLeft);
            if (powerAreaRight.length > 0) powerAreaPoints.push(powerAreaRight);

        } else if (haType === '>') { // Right-tailed (Rejection region is X > CV1)
            const xMinPower = criticalValue1;
            const xMaxPower = overallMaxX;
            if (xMinPower < xMaxPower) {
                powerAreaPoints = generateAreaPoints(actualParam, standardErrorHa, xMinPower, xMaxPower);
            }
        } else { // Left-tailed (haType === '<') (Rejection region is X < CV1)
            const xMinPower = overallMinX;
            const xMaxPower = criticalValue1;
            if (xMinPower < xMaxPower) {
                powerAreaPoints = generateAreaPoints(actualParam, standardErrorHa, xMinPower, xMaxPower);
            }
        }
    }
    // If powerAreaPoints is not an array of arrays (i.e. for one-tailed test)
    // and the VisualizationPanel expects an array of arrays, wrap it.
    // The current VisualizationPanel handles this:
    // (Array.isArray(powerAreaPoints[0]) ? powerAreaPoints : [powerAreaPoints])
    // So if powerAreaPoints is already [[...points...]], it's fine.
    // If it's just [...points...], it gets wrapped into [[...points...]].

    return { alphaAreaPoints, betaAreaPoints, powerAreaPoints };
};