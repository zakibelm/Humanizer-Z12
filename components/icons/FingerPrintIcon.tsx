import React from 'react';
const FingerPrintIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.875 14.25l1.214 1.942a2.25 2.25 0 001.908 1.058h2.006c.776 0 1.497-.4 1.908-1.058l1.214-1.942M2.41 9.31a10.5 10.5 0 0119.18 0M8.684 5.077A4.875 4.875 0 0112 4.5c1.255 0 2.413.473 3.316 1.253M12 9.75V12m0 0v2.25m0-2.25H9.75m2.25 0h2.25" />
  </svg>
);
export default FingerPrintIcon;