import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LossGraph = ({ data, showAccuracy = false }) => {
  // Transform data for Recharts
  const chartData = data.loss.map((item, index) => ({
    epoch: item.epoch,
    loss: item.value,
    accuracy: showAccuracy && data.accuracy[index] ? data.accuracy[index].value : null,
  }));

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.3} />
          <XAxis
            dataKey="epoch"
            label={{ value: 'Epoch', position: 'insideBottom', offset: -2, fill: '#9ca3af', fontSize: 11 }}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            stroke="#6b7280"
          />
          <YAxis
            yAxisId="loss"
            label={{ value: 'Loss', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 11 }}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            stroke="#6b7280"
          />
          {showAccuracy && (
            <YAxis
              yAxisId="acc"
              orientation="right"
              domain={[0, 1]}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              label={{ value: 'Accuracy', angle: 90, position: 'insideRight', fill: '#9ca3af', fontSize: 11 }}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              stroke="#10b981"
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              fontSize: '11px',
              color: '#e5e7eb'
            }}
            formatter={(value, name) => {
              if (value === null || value === undefined) return 'N/A';
              if (name === 'Accuracy') return `${(value * 100).toFixed(2)}%`;
              return value.toFixed(4);
            }}
            labelStyle={{ color: '#e5e7eb' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
            iconType="line"
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
          />

          {/* Training Loss */}
          <Line
            type="monotone"
            dataKey="loss"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="Train Loss"
            yAxisId="loss"
            connectNulls
          />

          {/* Accuracy Lines (if enabled) */}
          {showAccuracy && (
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Accuracy"
              yAxisId="acc"
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LossGraph;
