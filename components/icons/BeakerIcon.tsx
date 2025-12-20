import React from 'react';
const BeakerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v1.242c0 .232.067.46.193.655l4.114 6.366a1.125 1.125 0 010 1.228l-4.114 6.366a1.125 1.125 0 01-.193.655v1.242m-5.151-16.5a1.125 1.125 0 011.124-1.124h10.352a1.125 1.125 0 011.124 1.124m-12.6 16.5a1.125 1.125 0 001.124 1.124h10.352a1.125 1.125 0 001.124-1.124m-12.6-1.124h12.6" />
  </svg>
);
export default BeakerIcon;