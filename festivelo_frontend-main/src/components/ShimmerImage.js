import React, { useState } from 'react';
import '../styles/ShimmerImage.css';

const ShimmerImage = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className="shimmer-wrapper">
      {!isLoaded && <div className="shimmer" />}
      <img
        src={src}
        alt={alt}
        className={`shimmer-image ${isLoaded ? 'loaded' : ''} ${className || ''}`}
        onLoad={handleImageLoad}
      />
    </div>
  );
};

export default ShimmerImage; 