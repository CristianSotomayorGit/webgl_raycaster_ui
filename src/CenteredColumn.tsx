import React, { ReactNode } from 'react';
import './App.css'; // Assuming you have some basic styles in App.css

type CenteredColumnProps = {
  children?: ReactNode;
};

const CenteredColumn: React.FC<CenteredColumnProps> = ({ children }) => {
  const columnStyle: React.CSSProperties = {
    width: '1000px',
    margin: '0 auto', // Center the column horizontally
    padding: '20px',
    backgroundColor: '#1d1d1d', // Light grey background for visibility
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Light shadow for depth
    borderRadius: '8px',
    border: 'solid #2d2d2d',    
    boxSizing: 'border-box', // Include padding in the element's total width and height
    display: 'flex',
    flexDirection: 'column',
    height: '100%', // Make the column take up the full height
    overflow: 'hidden', // Prevent overflow from the column
    marginBottom: '20px',
  };

  return (
    <div style={columnStyle}>
      {children}
    </div>
  );
};

export default CenteredColumn;
