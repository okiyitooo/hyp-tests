import React, { useMemo } from 'react';
import { useAppState } from '../context/AppStateContext';
import {
    ResponsiveContainer,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    Label,
    ComposedChart,
    Area
} from 'recharts';

const VisualizationPanel = () => {
    const state = useAppState();
    const {
        h0Value, // For mean lines
        actualParam, // For mean lines
        h0DistPoints,
        haDistPoints,
        criticalValue1,
        criticalValue2, // Only for two-tailed
        haType,
        alpha,
        beta,
        power,
        showH0Distribution,
        showHaDistribution,
        showCriticalValues,
        showMeanH0,
        showMeanHa,
        // add alphaAreaPoints, betaAreaPoints, powerAreaPoints to state later
        alphaAreaPoints,
        betaAreaPoints,
        powerAreaPoints,
        showAlphaArea,
        showBetaArea,
        showPowerArea,
    } = state;

    // removed in testing
    const chartData = useMemo(() => {
        const allXValues = new Set();
        h0DistPoints.forEach(p => allXValues.add(p.x));
        haDistPoints.forEach(p => allXValues.add(p.x));

        const sortedXValues = Array.from(allXValues).sort((a, b) => a - b);

        const combinedData = sortedXValues.map(x => {
            const h0Point = h0DistPoints.find(p => p.x === x);
            const haPoint = haDistPoints.find(p => p.x === x);
            return {
                x: x,
                h0y: h0Point ? h0Point.y : null, // Or 0, or undefined depending on Recharts handling
                hay: haPoint ? haPoint.y : null,
            };
        });
        return { h0DistPoints, haDistPoints };

    }, [h0DistPoints, haDistPoints]);


    // Determine chart domain dynamically
    const xDomain = useMemo(() => {
        if (h0DistPoints.length === 0 && haDistPoints.length === 0) {
            return ['auto', 'auto'];
        }
        const allPoints = [...h0DistPoints, ...haDistPoints];
        let minX = Math.min(...allPoints.map(p => p.x));
        let maxX = Math.max(...allPoints.map(p => p.x));

        // Ensure critical values are within view if they extend beyond points
        if (criticalValue1 !== null) {
            minX = Math.min(minX, criticalValue1);
            maxX = Math.max(maxX, criticalValue1);
        }
        if (criticalValue2 !== null) {
            minX = Math.min(minX, criticalValue2);
            maxX = Math.max(maxX, criticalValue2);
        }
        // Add some padding
        const range = maxX - minX;
        return [minX - range * 0.05, maxX + range * 0.05];
    }, [h0DistPoints, haDistPoints, criticalValue1, criticalValue2]);

    const yDomain = useMemo(() => {
        // Ensure we consider only active distributions if others are empty or not shown,
        // though Recharts should handle empty data arrays for non-rendered lines.
        const pointsToConsider = [];
        if (showH0Distribution && h0DistPoints && h0DistPoints.length > 0) {
            pointsToConsider.push(...h0DistPoints);
        }
        if (showHaDistribution && haDistPoints && haDistPoints.length > 0) {
            pointsToConsider.push(...haDistPoints);
        }
        if (pointsToConsider.length === 0) {
            let maxYFromAreas = 0;
            if (showAlphaArea && alphaAreaPoints && alphaAreaPoints.length > 0) 
                maxYFromAreas = Math.max(maxYFromAreas, ...alphaAreaPoints.map(p => p.y));
            if (showBetaArea && betaAreaPoints && betaAreaPoints.length > 0) 
                maxYFromAreas = Math.max(maxYFromAreas, ...betaAreaPoints.map(p => p.y));
            if (showPowerArea && powerAreaPoints && powerAreaPoints.length > 0) {
                (Array.isArray(powerAreaPoints[0]) ? powerAreaPoints : [powerAreaPoints]).forEach(areaSet => {
                    if (areaSet.length > 0) maxYFromAreas = Math.max(maxYFromAreas, ...areaSet.map(p => p.y));
                });
            }
            return [0, maxYFromAreas > 0 ? maxYFromAreas * 1.1 : 0.1];
        }
        const maxY = Math.max(...pointsToConsider.map(p => p.y));
        return [0, maxY > 0 ? maxY * 1.1 : 0.1]; // Ensure maxY is not 0, add padding
    }, [h0DistPoints, haDistPoints, alphaAreaPoints, 
        betaAreaPoints, powerAreaPoints, showH0Distribution, 
        showHaDistribution, showAlphaArea, showBetaArea, showPowerArea]);


    if (h0DistPoints.length === 0 || haDistPoints.length === 0) {
        return (
            <div className="visualization-panel">
                <h2>Visualization</h2>
                <p>Please set parameters to see the visualization.</p>
            </div>
        );
    }
    const isMultiArea = (points) => points && points.length > 0 && Array.isArray(points[0]);
    return (
        <div className="visualization-panel" style={{ width: '100%', height: 500 }}>
            <h2>Visualization</h2>
            <ResponsiveContainer>
                {/* AreaChart as a base because Area components need it. Line components work fine in it. */}
                <ComposedChart
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        type="number"
                        dataKey="x"
                        name="Value"
                        domain={xDomain}
                        allowDataOverflow={true}
                        label={{ value: "Parameter Value", position: 'insideBottom', offset: -15 }}
                        // floating point of 2
                        tickFormatter={(value) => value.toFixed(2)}
                        scale="linear"
                    />
                    <YAxis
                        type="number"
                        domain={yDomain}
                        allowDataOverflow={true}
                        label={{ value: 'Density', angle: -90, position: 'insideLeft', offset: 0 }}
                        tickFormatter={(value) => value.toFixed(4)}
                        scale="linear"
                    />
                    <Tooltip formatter={(value, name, props) => [value.toFixed(4), name]} />
                    {/* <Legend /> custom LegendPanel */}
                    
                    {showAlphaArea && alphaAreaPoints && alphaAreaPoints.length > 0 && 
                        (isMultiArea(alphaAreaPoints) ? alphaAreaPoints : [alphaAreaPoints]).map((points, index) => (
                            points && points.length > 0 &&
                            <Area
                                key={`alphaArea-${index}`}
                                type="monotone"
                                data={points}
                                dataKey="y"
                                name={`α Area ${isMultiArea(alphaAreaPoints) ? index + 1 : ''}`}
                                fill="#ffb366"
                                stroke="#ffb366"
                                fillOpacity={0.5}
                                connectNulls={false}
                                baseValue={0}
                                isAnimationActive={false}
                            />
                        ))}
                    {showBetaArea && betaAreaPoints && betaAreaPoints.length > 0 && (
                        <Area type="monotone" data={betaAreaPoints} dataKey="y" name="β Area" fill="#c43a31" stroke="#c43a31" fillOpacity={0.3} connectNulls baseValue={0}/>
                    )}
                    {showPowerArea && powerAreaPoints && powerAreaPoints.length > 0 && (
                        // If powerAreaPoints is an array of arrays for two-tailed, map over it
                        (Array.isArray(powerAreaPoints[0]) ? powerAreaPoints : [powerAreaPoints]).map((points, index) => (
                            <Area key={`powerArea-${index}`} type="monotone" data={points} dataKey="y" name={`Power Area ${Array.isArray(powerAreaPoints[0]) ? index+1 : ''}`} fill="#82ca9d" stroke="#82ca9d" fillOpacity={0.3} connectNulls baseValue={0}/>
                        ))
                    )}

                    {/* H₀ Distribution Line */}
                    {showH0Distribution && h0DistPoints.length > 1 && (
                        <Line
                            type="monotone"
                            data={h0DistPoints}
                            dataKey="y"
                            name={`H₀ Distribution (μ₀=${h0Value.toFixed(2)})`}
                            stroke="#4a47a3"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                    )}

                    {/* Hₐ Distribution Line */}
                    {showHaDistribution && haDistPoints.length > 1 && (
                        <Line
                            type="monotone"
                            data={haDistPoints}
                            dataKey="y"
                            name={`Hₐ Distribution (μₐ=${actualParam.toFixed(2)})`}
                            stroke="#018034"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={true}
                        />
                    )}


                    {/* Critical Value Line(s) */}
                    {showCriticalValues && criticalValue1 !== null && (
                        <ReferenceLine x={criticalValue1} stroke="red" strokeDasharray="3 3">
                            <Label value={`CV1: ${criticalValue1.toFixed(2)}`} position="top" fill="red" />
                        </ReferenceLine>
                    )}
                    {showCriticalValues && criticalValue2 !== null && haType === '≠' && (
                        <ReferenceLine x={criticalValue2} stroke="red" strokeDasharray="3 3">
                             <Label value={`CV2: ${criticalValue2.toFixed(2)}`} position="top" fill="red" />
                        </ReferenceLine>
                    )}

                    {/* Mean of H₀ */}
                    {showMeanH0 && h0Value !== null && (
                         <ReferenceLine x={h0Value} stroke="#8884d8" strokeDasharray="2 2" opacity={0.7}>
                            <Label value={`μ₀: ${h0Value.toFixed(2)}`} position="bottom" fill="#8884d8" fontSize="10"/>
                        </ReferenceLine>
                    )}
                    {/* Mean of Hₐ */}
                    {showMeanHa && actualParam !== null && (
                         <ReferenceLine x={actualParam} stroke="#82ca9d" strokeDasharray="2 2" opacity={0.7}>
                            <Label value={`μₐ: ${actualParam.toFixed(2)}`} position="bottom" fill="#82ca9d" fontSize="10"/>
                        </ReferenceLine>
                    )}

                </ComposedChart>
            </ResponsiveContainer>
            <div className="debug-info" style={{fontSize: '10px', marginTop:'10px', maxHeight: '100px', overflowY:'auto'}}>
                Alpha: {alpha?.toFixed(4)}, Beta: {beta?.toFixed(4)}, Power: {power?.toFixed(4)} <br/>
                CV1: {criticalValue1?.toFixed(4)}, CV2: {criticalValue2?.toFixed(4)} <br/>
                α points structure: {alphaAreaPoints ? (isMultiArea(alphaAreaPoints) ? `Multi (${alphaAreaPoints.length} areas)` : `Single (length ${alphaAreaPoints.length})`) : 'None'} <br/>
                β points: {betaAreaPoints?.length}, Power sets: {powerAreaPoints ? (isMultiArea(powerAreaPoints) ? powerAreaPoints.length : `1 (len ${powerAreaPoints.length})`) : 'None'}
            </div>
        </div>
    );
};

export default VisualizationPanel;