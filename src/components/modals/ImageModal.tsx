import React from "react";

interface ImageModalProps {
  src: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ src, onClose }) => {
  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Full size" className="image-modal-img" />
        <button className="image-modal-close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default ImageModal;
