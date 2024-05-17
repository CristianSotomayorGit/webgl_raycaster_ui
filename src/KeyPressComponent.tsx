import React, { useEffect } from 'react';

const KeyPressComponent: React.FC = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'a':
          console.log('A key pressed');
          break;
        case 'w':
          console.log('W key pressed');
          break;
        case 's':
          console.log('S key pressed');
          break;
        case 'd':
          console.log('D key pressed');
          break;
        default:
          // Handle other keys or do nothing
          break;
      }
    };

    // Add event listener for the keydown event
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array means this effect will only run once after the initial render

  return (
    <div>
      Press the keys A, W, S, or D and check the console!
    </div>
  );
}

export default KeyPressComponent;
